import type { CustomPointPreset, CustomPointPresetExportBundle, CustomPointPresetStorage } from '@eftypes/custom_point';
import type {
  CustomPointData,
  CustomPointMapData,
  EndfieldMapAdapter,
  EntityVisibility,
  StorageData,
} from '@endfieldmap/map-core';
import type { CustomPointTypeId } from '@endfieldmap/map-core';
import { CustomPointKey, getDefaultCustomPointType, MAP_EVENT } from '@endfieldmap/map-core';
import {
  debounce,
  LocalStorageDB,
  LocalStorageKey,
  logger,
  MapIndex,
  StorageKey,
  type StorageManager,
} from '@endfieldmap/tools';
import { action, autorun, computed, observable, runInAction, toJS } from 'mobx';

import { alert } from '@/components/common/alert/alert_api';
import { DEBOUNCE_INTERVAL, EXPORT_TYPE_KEY, type VersionType } from '@/const/data';

/**
 * 自定义标点数据管理器
 */
export class CustomPointDataService {
  private adapter: EndfieldMapAdapter;
  private storage: StorageManager;

  @observable accessor dataVersion: VersionType = '0.0.1';

  @observable accessor presetStorage: CustomPointPresetStorage = {
    presets: [],
    currentPresetId: null,
  };

  @observable accessor customPointVisibility: boolean = true;
  public customPointVisibilityData: StorageData<EntityVisibility> = {};

  private initialized: boolean = false;

  @observable accessor isCreating: boolean = false;
  @observable accessor isDeleting: boolean = false;
  @observable accessor selectedPointType: CustomPointTypeId = getDefaultCustomPointType().id;

  private eventListenerDisposers: Array<() => void> = [];
  private reactionDisposers: Array<() => void> = [];

  constructor(storage: StorageManager, adapter: EndfieldMapAdapter) {
    this.storage = storage;
    this.adapter = adapter;
    this.initAdapter();
  }

  private initAdapter() {
    this.applyCurrentPresetToAdapter();
    this.initAutoSaveReaction();
    this.initMapClickEvent();
    this.initCustomPointClickEvent();
  }

  public async initFromStorage() {
    if (this.initialized) return;

    const [stored, visibility, visibilityData] = await Promise.all([
      this.storage.permanentGet<CustomPointPresetStorage>(StorageKey.CUSTOM_POINT),
      LocalStorageDB.get<boolean>(LocalStorageKey.CUSTOM_POINT_DISPLAY),
      this.storage.permanentGet<StorageData<EntityVisibility>>(StorageKey.CUSTOM_POINT_VISIBILITY),
    ]);

    runInAction(() => {
      if (stored && Array.isArray(stored.presets)) {
        const normalizedPresets = stored.presets.map((preset) => ({
          ...preset,
          data: this.ensureMapData(preset.data),
        }));
        this.presetStorage = {
          presets: normalizedPresets,
          currentPresetId: stored.currentPresetId ?? normalizedPresets[0]?.id ?? null,
        };
      } else {
        // 如果还没有任何记录，则保持空预设列表，后续第一次保存时再创建默认预设
        this.presetStorage = {
          presets: [],
          currentPresetId: null,
        };
      }
      this.customPointVisibility = visibility ?? true;
      this.customPointVisibilityData = visibilityData || {};
      this.initialized = true;
    });

    // 从存储加载数据后，将当前预设应用到地图
    this.applyCurrentPresetToAdapter();
  }

  private ensureMapData(data: Partial<CustomPointMapData>): CustomPointMapData {
    const ensured: Partial<CustomPointMapData> = {};
    const mapIndices: MapIndex[] = [MapIndex.MAP01, MapIndex.MAP02];

    mapIndices.forEach((mapIndex) => {
      if (!data[mapIndex]) {
        ensured[mapIndex] = [];
      } else if (Array.isArray(data[mapIndex])) {
        // 验证并过滤掉无效的自定义标点数据
        const validPoints = data[mapIndex]!.filter((point) => {
          // 检查是否有有效的对象
          if (!point || typeof point !== 'object') {
            logger.warn('[CustomPointDataService|ensureMapData] Invalid point data (not an object)', {
              mapIndex,
              point,
            });
            return false;
          }

          // 检查坐标是否存在且有效
          if (!point.position || typeof point.position !== 'object') {
            logger.warn('[CustomPointDataService|ensureMapData] Missing or invalid position', { mapIndex, point });
            return false;
          }

          // 检查 x 和 y 属性是否存在且为数字
          if (typeof point.position.x !== 'number' || typeof point.position.y !== 'number') {
            logger.warn('[CustomPointDataService|ensureMapData] Invalid position x/y values', {
              mapIndex,
              pointId: point.levelLogicId,
              position: point.position,
            });
            return false;
          }

          // 检查 x 和 y 是否为有效数字（非 NaN, 非 Infinity）
          if (!Number.isFinite(point.position.x) || !Number.isFinite(point.position.y)) {
            logger.warn('[CustomPointDataService|ensureMapData] Position contains NaN or Infinity', {
              mapIndex,
              pointId: point.levelLogicId,
              position: point.position,
            });
            return false;
          }

          return true;
        });

        // 如果过滤掉了一些无效数据，记录警告
        const filteredCount = data[mapIndex]!.length - validPoints.length;
        if (filteredCount > 0) {
          logger.warn(
            `[CustomPointDataService|ensureMapData] Filtered out ${filteredCount} invalid custom point(s) from ${mapIndex}`,
            data[mapIndex],
            validPoints
          );
        }

        ensured[mapIndex] = validPoints;
      } else {
        ensured[mapIndex] = [];
      }
    });

    return ensured as CustomPointMapData;
  }

  @computed
  public get currentPreset(): CustomPointPreset | null {
    return this.presetStorage.presets.find((p) => p.id === this.presetStorage.currentPresetId) ?? null;
  }

  @computed
  public get currentPresetId(): string | null {
    return this.presetStorage.currentPresetId;
  }

  @computed
  public get presetList() {
    return this.presetStorage.presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
    }));
  }

  // region: 预设管理
  /**
   * 创建新的预设
   * @param name 预设名称
   * @param initialData 初始化数据，传入 true 则使用当前地图数据，传入数据对象则使用该数据，未传入则使用空数据
   * @returns
   */
  public async createPreset(name: string, initialData?: CustomPointMapData | boolean) {
    const now = Date.now();
    const useInitialData = !!initialData && initialData !== true;
    const useCurrentData = initialData === true;
    const baseData = useInitialData
      ? initialData
      : this.initialized && useCurrentData
        ? this.adapter.customPointController.dataManager.allData
        : ({} as CustomPointMapData);
    const ensuredData = this.ensureMapData(baseData);

    const newPreset: CustomPointPreset = {
      id: this.generatePresetId(),
      name,
      data: ensuredData,
      createdAt: now,
      updatedAt: now,
    };

    runInAction(() => {
      this.presetStorage.presets.push(newPreset);
      this.clearActiveFeature();
      this.presetStorage.currentPresetId = newPreset.id;
    });

    await this.savePresetStorage();

    this.applyPresetToAdapter(newPreset);

    return newPreset;
  }

  /**
   * 切换预设
   * @param id 预设id
   * @returns
   */
  public async switchPreset(id: string) {
    if (this.presetStorage.currentPresetId === id) return;
    this.clearActiveFeature();

    const preset = this.presetStorage.presets.find((p) => p.id === id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    runInAction(() => {
      this.presetStorage.currentPresetId = id;
    });

    await this.savePresetStorage();

    this.applyPresetToAdapter(toJS(preset));
  }

  /**
   * 删除预设
   * @param id 预设id
   * @returns
   */
  public async deletePreset(id: string) {
    const index = this.presetStorage.presets.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Preset not found: ${id}`);
    }

    const isCurrent = this.presetStorage.currentPresetId === id;
    let nextPreset: CustomPointPreset | null = null;

    runInAction(() => {
      this.presetStorage.presets.splice(index, 1);

      if (isCurrent) {
        nextPreset = this.presetStorage.presets[0] ?? null;
        this.presetStorage.currentPresetId = nextPreset ? nextPreset.id : null;
        this.clearActiveFeature();
      } else if (!this.presetStorage.presets.length) {
        this.presetStorage.currentPresetId = null;
        this.clearActiveFeature();
      }
    });

    await this.savePresetStorage();

    // 仅当删除的是当前预设时，才更新地图上的自定义标点数据
    if (isCurrent) {
      if (nextPreset) {
        this.applyPresetToAdapter(toJS(nextPreset));
      } else {
        // 若已经没有任何预设，则清空所有地图上的自定义标点
        const emptyData = this.ensureMapData({} as CustomPointMapData);
        this.adapter.customPointController.initCustomPointData(emptyData);
        this.adapter.renderCustomPoint(this.adapter.currentMapIndex);
      }
    }
  }

  /**
   * 重命名预设
   * @param id 预设id
   * @param name 新名称
   * @returns
   */
  public async renamePreset(id: string, name: string) {
    const preset = this.presetStorage.presets.find((p) => p.id === id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    runInAction(() => {
      preset.name = name;
      preset.updatedAt = Date.now();
    });

    await this.savePresetStorage();
  }

  /**
   * 内部方法-应用当前预设到适配器
   */
  private applyCurrentPresetToAdapter() {
    if (!this.initialized) return;
    const preset = this.currentPreset;
    if (!preset) return;
    this.applyPresetToAdapter(toJS(preset));
  }

  /**
   * 内部方法-保存预设存储结构到存储
   */
  private async savePresetStorage() {
    const plain = {
      presets: toJS(this.presetStorage.presets),
      currentPresetId: toJS(this.presetStorage.currentPresetId),
    };
    await this.storage.permanentSet(StorageKey.CUSTOM_POINT, plain);
  }

  /**
   * 内部方法-防抖保存预设存储结构到存储
   */
  private debouncedSave = debounce((currentData: Partial<Record<MapIndex, CustomPointData[]>>) => {
    if (!this.initialized) return;

    const ensuredData = this.ensureMapData(currentData);

    runInAction(() => {
      // 如果还没有任何预设，自动创建一个默认预设
      if (!this.currentPreset) {
        const now = Date.now();
        const newPreset: CustomPointPreset = {
          id: this.generatePresetId(),
          name: 'Default Preset',
          data: ensuredData,
          createdAt: now,
          updatedAt: now,
        };
        this.presetStorage.presets.push(newPreset);
        this.presetStorage.currentPresetId = newPreset.id;
      } else {
        this.currentPreset.data = ensuredData;
        this.currentPreset.updatedAt = Date.now();
      }
    });

    this.savePresetStorage();
  }, DEBOUNCE_INTERVAL);

  /**
   * 内部方法-应用预设到适配器
   */
  private applyPresetToAdapter(preset: CustomPointPreset) {
    try {
      const data = this.ensureMapData(preset.data);
      this.adapter.customPointController.initCustomPointData(data);
      // 重新渲染当前地图上的自定义标点
      this.adapter.renderCustomPoint(this.adapter.currentMapIndex);
      // 应用存储的可见性设置
      this.applyStoredVisibility(this.adapter.currentMapIndex);
    } catch (error) {
      logger.error('[CustomPointDataService|applyPresetToAdapter] Failed to apply preset, falling back to empty data', {
        presetId: preset.id,
        presetName: preset.name,
        error,
        preset: preset,
      });

      const adapter = this.adapter;
      // 通知用户数据可能已损坏
      alert.info({
        content: `自定义标点预设 "${preset.name}" 数据已损坏，请检查并重新创建预设。`,
        onCancel: () => {
          const emptyData = this.ensureMapData({} as CustomPointMapData);
          adapter?.customPointController.initCustomPointData(emptyData);
          adapter?.renderCustomPoint(adapter?.currentMapIndex);
        },
        cancelText: '删除损坏预设',
      });
    }
  }
  // endregion

  // region: 操作模式处理
  /**
   * 清除当前激活的 feature
   */
  public clearActiveFeature() {
    this.adapter.activeFeatureController?.clearActiveFeature?.();
  }

  /**
   * 设置创建模式是否开启
   * @param creating 是否开启创建模式
   */
  @action
  public setCreating(creating: boolean) {
    this.isCreating = creating;
    if (creating) {
      // 进入创建模式时清除 active feature
      this.clearActiveFeature();
    }
  }

  /**
   * 设置删除模式是否开启
   * @param deleting 是否开启删除模式
   */
  @action
  public setDeleting(deleting: boolean) {
    this.isDeleting = deleting;
    if (deleting) {
      // 进入删除模式时清除 active feature
      this.clearActiveFeature();
    }
  }

  /**
   * 现在是否处于自定义标点操作模式
   */
  // TODO: 更新需要补充 - 如果添加了新的操作模式，需要在这里添加判断
  @computed
  public get isInCustomPointOperateMode() {
    return this.isCreating || this.isDeleting;
  }

  /**
   * 停止所有操作模式
   */
  // TODO: 更新需要补充 - 如果添加了新的操作模式，需要在这里添加停止逻辑
  @action
  public stopAllOperation() {
    this.setCreating(false);
    this.setDeleting(false);
  }

  /**
   * 设置选中的自定义标点类型
   */
  @action
  public setSelectedPointType(pointType: CustomPointTypeId) {
    this.selectedPointType = pointType;
  }
  // endregion

  // region: 可见性管理
  /**
   * 修改自定义标点可见性
   */
  @action
  public changeVisibility(visible: boolean) {
    this.adapter.customPointController?.setCustomPointVisible?.(visible);
    this.customPointVisibility = visible;
    LocalStorageDB.set(LocalStorageKey.CUSTOM_POINT_DISPLAY, visible);
  }

  /**
   * 切换自定义标点可见性
   */
  @action
  public toggleVisibility() {
    const visible = !this.adapter.customPointController?.customPointVisible;
    this.changeVisibility(visible);
  }

  /**
   * 更新自定义标点类型的可见性
   */
  public updateCustomPointVisibility(mapIndex: MapIndex, entityDataIdKey: string, visible: boolean) {
    if (!this.customPointVisibilityData[mapIndex]) {
      this.customPointVisibilityData[mapIndex] = {};
    }
    this.customPointVisibilityData[mapIndex][entityDataIdKey] = visible;
    this.saveCustomPointVisibilityToStorageDebounced();
  }

  /**
   * 保存自定义标点可见性数据到存储
   */
  public async saveCustomPointVisibilityToStorage() {
    return await this.storage.permanentSet(StorageKey.CUSTOM_POINT_VISIBILITY, this.customPointVisibilityData);
  }

  /**
   * 防抖保存自定义标点可见性数据
   */
  get saveCustomPointVisibilityToStorageDebounced() {
    return debounce(this.saveCustomPointVisibilityToStorage.bind(this), DEBOUNCE_INTERVAL);
  }

  /**
   * 应用存储的可见性设置到自定义标点features
   */
  private applyStoredVisibility(mapIndex: MapIndex) {
    const visibilityData = this.customPointVisibilityData[mapIndex];
    if (!visibilityData) return;

    const dataManager = this.adapter.customPointController.dataManager;
    const manager = dataManager.getMapManager(mapIndex);
    if (!manager) return;

    const instances = manager.instances;
    instances.forEach((instance) => {
      const entityDataIdKey = instance.data.entityDataIdKey;
      if (entityDataIdKey in visibilityData) {
        instance.setVisible(visibilityData[entityDataIdKey]);
      }
    });
  }
  // endregion

  // region: 自定义标点增删
  /**
   * 创建新的自定义标点
   * @param mapIndex 地图索引
   * @param coordinate 坐标
   */
  public async createCustomPoint(mapIndex: MapIndex, coordinate: number[]) {
    if (!this.initialized) {
      throw new Error('CustomPointDataService not initialized');
    }

    const feature = this.adapter.customPointController.createCustomPoint(mapIndex, coordinate, this.selectedPointType);
    return feature;
  }

  /**
   * 删除自定义标点
   * @param mapIndex 地图索引
   * @param id 自定义标点ID
   */
  public async deleteCustomPoint(mapIndex: MapIndex, id: number) {
    if (!this.initialized) {
      throw new Error('CustomPointDataService not initialized');
    }

    return this.adapter.customPointController.deleteCustomPoint(mapIndex, id);
  }
  // endregion

  // region: 自定义标点事件初始化
  /**
   * 使用 MobX reaction 监听数据变化并自动保存
   */
  private initAutoSaveReaction() {
    const dispose = autorun(() => {
      const data = this.adapter.customPointController.dataManager.allData;
      this.debouncedSave(data);
    });
    this.reactionDisposers.push(dispose);
  }

  /**
   * 初始化地图点击事件监听（用于创建自定义标点）
   */
  private initMapClickEvent() {
    const dispose = this.adapter.event.on(MAP_EVENT.MAP_CLICK, (event) => {
      if (!this.isCreating) return;
      const mapIndex = this.adapter.currentMapIndex;
      const coordinate = event.coordinate;
      if (!coordinate) return;

      try {
        this.createCustomPoint(mapIndex, coordinate);
        // 确保图层被添加到地图上
        this.adapter.renderCustomPoint(mapIndex);
      } catch (error) {
        logger.error('[CustomPointDataService|initMapClickEvent] Failed to create custom point', error);
        alert.info({
          content: `创建失败：${error instanceof Error ? error.message : String(error)}`,
        });
      }
    });
    this.eventListenerDisposers.push(dispose);
  }

  /**
   * 初始化自定义标点点击事件监听（用于删除自定义标点）
   */
  private initCustomPointClickEvent() {
    if (!this.adapter) return;
    const dispose = this.adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
      if (!this.isDeleting) return;
      const instance = event.instance;
      const isCustomPoint = instance.entityInfo.category === CustomPointKey;
      if (!isCustomPoint) return;

      const mapIndex = this.adapter.currentMapIndex;
      try {
        this.deleteCustomPoint(mapIndex, instance.id);
        // 清除 hover 状态
        this.adapter.hoverFeatureController.clearHoverFeature();
      } catch (error) {
        logger.error('[CustomPointDataService|initCustomPointClickEvent] Failed to delete custom point', error);
        alert.info({
          content: `删除失败：${error instanceof Error ? error.message : String(error)}`,
        });
      }
    });
    this.eventListenerDisposers.push(dispose);
  }

  /**
   * 清理资源，取消注册所有事件监听器
   */
  public dispose() {
    // 清理所有事件监听器
    this.eventListenerDisposers.forEach((dispose) => dispose());
    this.eventListenerDisposers = [];
    this.initialized = false;
  }
  // endregion

  private generatePresetId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // region: 导入导出处理
  public async exportPresets(ids: string[]) {
    if (!ids.length) {
      throw new Error('No custom point presets selected to export');
    }

    const idSet = new Set(ids);
    const presets = this.presetStorage.presets.filter((p) => idSet.has(p.id));

    if (!presets.length) {
      throw new Error('Selected custom point presets not found');
    }

    await this.downloadPresetBundle(presets);
  }

  /**
   * 在浏览器中触发下载 JSON 文件(支持导出多个预设)
   * 优先使用 File System Access API，不支持时回退到 <a> 标签下载
   */
  private async downloadPresetBundle(presets: CustomPointPreset[]) {
    const bundle: CustomPointPresetExportBundle = {
      type: EXPORT_TYPE_KEY.CUSTOM_POINT_PRESET,
      version: this.dataVersion,
      exportedAt: Date.now(),
      presets: presets.map((p) => ({
        ...toJS(p),
        data: this.ensureMapData(p.data),
      })),
    };

    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    // 生成文件名
    let filename: string;
    if (presets.length === 1) {
      const preset = presets[0];
      filename = `custom_point_${preset.name || preset.id}.json`;
    } else {
      filename = `custom_point_presets_${presets.length}_${Date.now()}.json`;
    }

    // 尝试使用 File System Access API
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert.info('导出成功');
        return;
      } catch (error) {
        // 用户取消或其他错误，回退到 <a> 标签下载
        if (error instanceof Error && error.name !== 'AbortError') {
          logger.warn(
            '[CustomPointDataService|downloadPresetBundle] File System Access API failed, falling back to <a> tag download',
            error
          );
        }
      }
    }

    // 回退到传统的 <a> 标签下载方式
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public async importPresetBundle(bundle: CustomPointPresetExportBundle) {
    if (!bundle || bundle.type !== EXPORT_TYPE_KEY.CUSTOM_POINT_PRESET || !Array.isArray(bundle.presets)) {
      throw new Error('Invalid preset bundle format');
    }

    if (bundle.version !== this.dataVersion) {
      // TODO: 版本不匹配时的处理逻辑
      logger.warn('[CustomPointDataService|importPresetBundle] Importing preset bundle version mismatch', {
        expected: this.dataVersion,
        actual: bundle.version,
      });
    }

    const newPresets = bundle.presets.map((preset) => ({
      ...preset,
      id: this.generatePresetId(),
      data: this.ensureMapData(preset.data),
    }));

    runInAction(() => {
      this.presetStorage.presets.push(...newPresets);
    });

    await this.savePresetStorage();
  }
  // endregion
}
