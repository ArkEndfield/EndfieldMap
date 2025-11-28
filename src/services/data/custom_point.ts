import type { CustomPointPresetStorage, CustomPointPreset, CustomPointPresetExportBundle } from '@eftypes/custom_point';
import type { CustomPointMapData, EndfieldMapAdapter } from '@endfieldmap/map-core';
import { MAP_EVENT, CustomPointKey } from '@endfieldmap/map-core';
import type { CustomPointData } from '@endfieldmap/map-core/types';
import type { Position } from '@endfieldmap/map-core/types/position';
import {
  MapIndex,
  StorageKey,
  type StorageManager,
  debounce,
  crd2xyz,
  logger,
  calculateXYZDistance,
} from '@endfieldmap/tools';
import { action, computed, observable, runInAction, toJS } from 'mobx';
import { DEBOUNCE_INTERVAL } from '@/const/data';
import { getDefaultCustomPointType } from '@endfieldmap/map-core/data/custom_point';
import { alert } from '@/components/common/endfield_components/alert/alert_api';

/**
 * 自定义标点数据管理器
 */
export class CustomPointDataService {
  private adapter?: EndfieldMapAdapter;
  private storage: StorageManager;

  private storageInitialized: boolean = false;
  private adapterRegistered: boolean = false;

  @observable accessor presetStorage: CustomPointPresetStorage = {
    presets: [],
    currentPresetId: null,
  };

  private initialized: boolean = false;

  @observable accessor isCreating: boolean = false;
  @observable accessor isDeleting: boolean = false;

  private eventListenerDisposers: Array<() => void> = [];

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  public registerAdapter(adapter: EndfieldMapAdapter) {
    runInAction(() => {
      this.adapter = adapter;
      this.adapterRegistered = true;
      this.updateInitializedFlag();
    });
    this.applyCurrentPresetToAdapter();
    this.initCustomPointChangeEvent();
    this.initMapClickEvent();
    this.initCustomPointClickEvent();
  }

  public async initFromStorage() {
    if (this.storageInitialized) return;

    const stored = await this.storage.permanentGet<CustomPointPresetStorage>(StorageKey.CUSTOM_POINT);

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
      this.storageInitialized = true;
      this.updateInitializedFlag();
    });
  }

  private updateInitializedFlag() {
    this.initialized = this.storageInitialized && this.adapterRegistered;
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

  public async createPreset(name: string, initialData?: CustomPointMapData | boolean) {
    const now = Date.now();
    const useInitialData = !!initialData && initialData !== true;
    const useCurrentData = initialData === true;
    const baseData = useInitialData
      ? initialData
      : this.adapter && this.initialized && useCurrentData
        ? this.adapter.customPointController.allData
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

    if (this.adapter) {
      this.applyPresetToAdapter(newPreset);
    }

    return newPreset;
  }

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

    if (this.adapter) {
      this.applyPresetToAdapter(toJS(preset));
    }
  }

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
    if (this.adapter && isCurrent) {
      if (nextPreset) {
        this.applyPresetToAdapter(toJS(nextPreset));
      } else {
        // 若已经没有任何预设，则清空所有地图上的自定义标点
        const emptyData = this.ensureMapData({} as CustomPointMapData);
        this.adapter.customPointController.updateData(emptyData);
        this.adapter.renderCustomPoint(this.adapter.currentMapIndex);
      }
    }
  }

  public clearActiveFeature() {
    this.adapter?.activeFeatureController?.clearActiveFeature?.();
  }

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
   * 重命名当前预设（若存在）
   * @param name 新名称
   */
  public async renameCurrentPreset(name: string) {
    if (!this.currentPresetId) return;
    await this.renamePreset(this.currentPresetId, name);
  }

  /**
   * 删除当前预设（若存在）
   */
  public async deleteCurrentPreset() {
    if (!this.currentPresetId) return;
    await this.deletePreset(this.currentPresetId);
  }

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
   * 导出当前预设为 JSON 文件
   */
  public async exportCurrentPreset() {
    if (!this.currentPreset) {
      throw new Error('No current custom point preset to export');
    }
    await this.exportPresets([this.currentPreset.id]);
  }

  /**
   * 在浏览器中触发下载 JSON 文件(支持导出多个预设)
   * 优先使用 File System Access API，不支持时回退到 <a> 标签下载
   */
  private async downloadPresetBundle(presets: CustomPointPreset[]) {
    const bundle: CustomPointPresetExportBundle = {
      type: 'custom_point_preset_bundle',
      version: '1.0.0',
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
    if (!bundle || bundle.type !== 'custom_point_preset_bundle' || !Array.isArray(bundle.presets)) {
      throw new Error('Invalid preset bundle format');
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

  @action
  public setCreating(creating: boolean) {
    this.isCreating = creating;
    if (creating) {
      // 进入创建模式时清除 active feature
      this.clearActiveFeature();
    } else {
      // 退出创建模式时保存数据
      this.saveCurrentPresetData();
    }
  }

  @action
  public setDeleting(deleting: boolean) {
    this.isDeleting = deleting;
    if (deleting) {
      // 进入删除模式时清除 active feature
      this.clearActiveFeature();
    }
  }

  // TODO: 更新需要补充 - 如果添加了新的操作模式，需要在这里添加判断
  @computed
  public get isInCustomPointOperateMode() {
    return this.isCreating || this.isDeleting;
  }

  // TODO: 更新需要补充 - 如果添加了新的操作模式，需要在这里添加停止逻辑
  @action
  public stopAllOperation() {
    this.setCreating(false);
    this.setDeleting(false);
  }

  /**
   * 修改自定义标点可见性
   */
  @action
  public changeVisibility(visible: boolean) {
    this.adapter?.customPointController?.setCustomPointVisible?.(visible);
  }

  /**
   * 切换自定义标点可见性
   */
  @action
  public toggleVisibility() {
    const visible = !this.adapter?.customPointController?.customPointVisible;
    this.changeVisibility(visible);
  }

  public async createCustomPoint(mapIndex: MapIndex, position: Position) {
    if (!this.adapter || !this.initialized) {
      throw new Error('CustomPointDataService not initialized');
    }

    // 检查半径 10 范围内是否已存在标点（与电线杆相同的距离限制）
    const customPointLayer = this.adapter.customPointController.entityLayer.get(mapIndex);
    const duplicateRadius = 10;

    // 检查与已有自定义标点的距离
    if (customPointLayer) {
      const features = customPointLayer.entity.features.getArray();
      for (const feature of features) {
        const existingPos = feature.data.position;
        const distance = calculateXYZDistance(position, existingPos);

        if (distance < duplicateRadius) {
          // TODO: i18n
          throw new Error(`自定义标点距离过近 (距离: ${distance.toFixed(2)})`);
        }
      }
    }

    const defaultType = getDefaultCustomPointType();
    const newId = this.generateCustomPointId(mapIndex);

    const data: CustomPointData = {
      levelLogicId: newId,
      entityDataIdKey: CustomPointKey,
      templateId: '#custom_point',
      entityType: '#CustomPoint',
      position,
      properties: {
        pointType: defaultType.entityInfo.point,
      },
    };

    const feature = this.adapter.customPointController.addCustomPointEntity(mapIndex, data);
    return feature;
  }

  public async deleteCustomPoint(mapIndex: MapIndex, id: number) {
    if (!this.adapter || !this.initialized) {
      throw new Error('CustomPointDataService not initialized');
    }

    return this.adapter.customPointController.deleteCustomPointEntity(mapIndex, id);
  }

  private applyPresetToAdapter(preset: CustomPointPreset) {
    if (!this.adapter) return;

    try {
      const data = this.ensureMapData(preset.data);
      this.adapter.customPointController.updateData(data);
      // 重新渲染当前地图上的自定义标点
      this.adapter.renderCustomPoint(this.adapter.currentMapIndex);
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
          adapter?.customPointController.updateData(emptyData);
          adapter?.renderCustomPoint(adapter?.currentMapIndex);
        },
        cancelText: '删除损坏预设',
      });
    }
  }

  private applyCurrentPresetToAdapter() {
    if (!this.adapter || !this.storageInitialized) return;
    const preset = this.currentPreset;
    if (!preset) return;
    this.applyPresetToAdapter(toJS(preset));
  }

  private async savePresetStorage() {
    const plain = {
      presets: toJS(this.presetStorage.presets),
      currentPresetId: toJS(this.presetStorage.currentPresetId),
    };
    await this.storage.permanentSet(StorageKey.CUSTOM_POINT, plain);
  }

  private saveCurrentPresetData = debounce(() => {
    if (!this.adapter || !this.initialized) return;

    const currentData = this.adapter.customPointController.allData;
    const ensuredData = this.ensureMapData(currentData);

    runInAction(() => {
      // 如果还没有任何预设，自动创建一个默认预设
      if (!this.currentPreset) {
        const now = Date.now();
        const newPreset: CustomPointPreset = {
          id: this.generatePresetId(),
          name: '默认预设',
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

  private initCustomPointChangeEvent() {
    if (!this.adapter) return;
    const dispose = this.adapter.event.on(MAP_EVENT.CUSTOM_POINT_CHANGED, () => {
      this.saveCurrentPresetData();
    });
    this.eventListenerDisposers.push(dispose);
  }

  private initMapClickEvent() {
    if (!this.adapter) return;
    const dispose = this.adapter.event.on(MAP_EVENT.MAP_CLICK, (event) => {
      if (!this.isCreating) return;
      const mapIndex = this.adapter!.currentMapIndex;
      const coordinate = event.coordinate;
      if (!coordinate) return;

      try {
        const position = crd2xyz(coordinate, mapIndex);
        this.createCustomPoint(mapIndex, position);
        // 确保图层被添加到地图上
        this.adapter!.renderCustomPoint(mapIndex);
      } catch (error) {
        logger.error('[CustomPointDataService|initMapClickEvent] Failed to create custom point', error);
        alert.info({
          content: `创建失败：${error instanceof Error ? error.message : String(error)}`,
        });
      }
    });
    this.eventListenerDisposers.push(dispose);
  }

  private initCustomPointClickEvent() {
    if (!this.adapter) return;
    const dispose = this.adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
      if (!this.isDeleting) return;
      const instance = event.instance;
      const isCustomPoint = instance.entityInfo.category === CustomPointKey;
      if (!isCustomPoint) return;

      const mapIndex = this.adapter!.currentMapIndex;
      try {
        this.deleteCustomPoint(mapIndex, instance.id);
        // 清除 hover 状态
        this.adapter?.mapController.hoverFeatureController.clearHoverFeature();
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

    // 清除 adapter 引用
    this.adapter = undefined;
    this.adapterRegistered = false;
    this.updateInitializedFlag();
  }

  private generatePresetId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCustomPointId(mapIndex: MapIndex): number {
    if (!this.adapter) return Date.now();
    const existingIds =
      this.adapter.customPointController.entityLayer
        .get(mapIndex)
        ?.entity.features.getArray()
        .map((f) => f.id) ?? [];
    let newId = Date.now();
    while (existingIds.includes(newId)) {
      newId++;
    }
    return newId;
  }
}
