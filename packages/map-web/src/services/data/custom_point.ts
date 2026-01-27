import type { CustomPointPreset, CustomPointPresetExportBundle } from '@eftypes/custom_point';
import type {
  Coordinate,
  CustomPointMapData,
  CustomPointTypeId,
  EndfieldMapAdapter,
  EntityVisibility,
  MapData,
  StorageData,
} from '@endfieldmap/map-core';
import { CustomPointKey, getDefaultCustomPointType, MAP_EVENT } from '@endfieldmap/map-core';
import { debounce, LocalStorageDB, LocalStorageKey, logger, StorageKey, type StorageManager } from '@endfieldmap/tools';
import { action, autorun, computed, observable, reaction, runInAction, toJS } from 'mobx';

import { alert } from '@/components/common/alert/alert_api';
import { DEBOUNCE_INTERVAL, EXPORT_TYPE_KEY } from '@/const/data';
import { BasePresetDataService } from '@/services/data/base/base_preset';

/**
 * 自定义标点数据管理器
 */
export class CustomPointDataService extends BasePresetDataService<
  CustomPointMapData,
  CustomPointPreset,
  CustomPointPresetExportBundle
> {
  private adapter: EndfieldMapAdapter;

  protected get storageKey(): string {
    return StorageKey.CUSTOM_POINT;
  }

  protected get exportTypeKey(): string {
    return EXPORT_TYPE_KEY.CUSTOM_POINT_PRESET;
  }

  @observable accessor customPointVisibility: boolean = true;
  @observable accessor customPointVisibilityData: StorageData<EntityVisibility> = {};

  @observable accessor isCreating: boolean = false;
  @observable accessor isDeleting: boolean = false;
  @observable accessor selectedPointType: CustomPointTypeId = getDefaultCustomPointType().id;

  private eventListenerDisposers: Array<() => void> = [];
  private reactionDisposers: Array<() => void> = [];

  constructor(storage: StorageManager, adapter: EndfieldMapAdapter) {
    super(storage);
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

    await this.initPresetFromStorage();

    const [visibility, visibilityData] = await Promise.all([
      LocalStorageDB.get<boolean>(LocalStorageKey.CUSTOM_POINT_DISPLAY),
      this.storage.permanentGet<StorageData<EntityVisibility>>(StorageKey.CUSTOM_POINT_VISIBILITY),
    ]);

    runInAction(() => {
      this.customPointVisibility = visibility ?? true;
      this.customPointVisibilityData = visibilityData || {};
      this.initialized = true;
    });

    // 从存储加载数据后，将当前预设应用到地图
    this.applyCurrentPresetToAdapter();
  }

  protected ensureMapData(data: Partial<CustomPointMapData> | unknown): CustomPointMapData {
    if (!data || typeof data !== 'object') {
      data = {};
    }
    const safeData = data as Partial<CustomPointMapData>;
    const ensured: Partial<CustomPointMapData> = {};
    const mapIds = this.adapter.mapController.dataManager.mapIds;

    mapIds.forEach((mapId) => {
      if (!safeData[mapId]) {
        ensured[mapId] = [];
      } else if (Array.isArray(safeData[mapId])) {
        // 验证并过滤掉无效的自定义标点数据
        const validPoints = safeData[mapId]!.filter((point) => {
          // 检查是否有有效的对象
          if (!point || typeof point !== 'object') {
            logger.warn('[CustomPointDataService|ensureMapData] Invalid point data (not an object)', {
              mapId,
              point,
            });
            return false;
          }

          // 检查坐标是否存在且有效
          if (!point.position || typeof point.position !== 'object') {
            logger.warn('[CustomPointDataService|ensureMapData] Missing or invalid position', { mapId, point });
            return false;
          }

          // 检查 x 和 y 属性是否存在且为数字
          if (typeof point.position.x !== 'number' || typeof point.position.y !== 'number') {
            logger.warn('[CustomPointDataService|ensureMapData] Invalid position x/y values', {
              mapId,
              pointId: point.levelLogicId,
              position: point.position,
            });
            return false;
          }

          // 检查 x 和 y 是否为有效数字（非 NaN, 非 Infinity）
          if (!Number.isFinite(point.position.x) || !Number.isFinite(point.position.y)) {
            logger.warn('[CustomPointDataService|ensureMapData] Position contains NaN or Infinity', {
              mapId,
              pointId: point.levelLogicId,
              position: point.position,
            });
            return false;
          }

          return true;
        });

        // 如果过滤掉了一些无效数据，记录警告
        const filteredCount = safeData[mapId]!.length - validPoints.length;
        if (filteredCount > 0) {
          logger.warn(
            `[CustomPointDataService|ensureMapData] Filtered out ${filteredCount} invalid custom point(s) from ${mapId}`,
            safeData[mapId],
            validPoints
          );
        }

        ensured[mapId] = validPoints;
      } else {
        ensured[mapId] = [];
      }
    });

    return ensured as CustomPointMapData;
  }

  /**
   * 内部方法-防抖保存预设存储结构到存储
   */
  private debouncedSave = debounce((currentData: CustomPointMapData) => {
    this.upsertCurrentPresetData(currentData);
  }, DEBOUNCE_INTERVAL);

  /**
   * 内部方法-应用预设到适配器
   */
  protected applyPresetToAdapter(preset: CustomPointPreset) {
    try {
      const data = this.ensureMapData(preset.data);
      this.adapter.customPointController.initCustomPointData(data);
      // 应用存储的可见性设置
      this.applyStoredVisibility(this.adapter.mapController.dataManager.currentMapId);
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
        },
        cancelText: '删除损坏预设',
      });
    }
  }

  protected get temporaryData(): CustomPointMapData {
    return this.adapter.customPointController.dataManager.allData;
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
    const visible = !this.adapter.customPointController.dataManager.visible;
    this.changeVisibility(visible);
  }

  /**
   * 更新自定义标点类型的可见性
   */
  public updateCustomPointVisibility(mapId: MapData['id'], entityDataIdKey: string, visible: boolean) {
    if (!this.customPointVisibilityData[mapId]) {
      this.customPointVisibilityData[mapId] = {};
    }
    this.customPointVisibilityData[mapId][entityDataIdKey] = visible;
    this.saveCustomPointVisibilityToStorageDebounced();
  }

  /**
   * 保存自定义标点可见性数据到存储
   */
  public async saveCustomPointVisibilityToStorage() {
    return await this.storage.permanentSet(StorageKey.CUSTOM_POINT_VISIBILITY, toJS(this.customPointVisibilityData));
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
  private applyStoredVisibility(mapId: MapData['id']) {
    const visibilityData = this.customPointVisibilityData[mapId];
    if (!visibilityData) return;

    const dataManager = this.adapter.customPointController.dataManager;
    const manager = dataManager.getMapManager(mapId);
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
   * @param mapId 地图ID
   * @param coordinate 坐标
   */
  public async createCustomPoint(mapId: MapData['id'], coordinate: Coordinate) {
    if (!this.initialized) {
      throw new Error('CustomPointDataService not initialized');
    }

    // 创建前确保该类型可见
    this.updateCustomPointVisibility(mapId, this.selectedPointType, true);

    const feature = this.adapter.customPointController.createCustomPoint(mapId, coordinate, this.selectedPointType);
    return feature;
  }

  /**
   * 删除自定义标点
   * @param mapId 地图ID
   * @param id 自定义标点ID
   */
  public async deleteCustomPoint(mapId: MapData['id'], id: number) {
    if (!this.initialized) {
      throw new Error('CustomPointDataService not initialized');
    }

    return this.adapter.customPointController.deleteCustomPoint(mapId, id);
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

    const visibilityDispose = reaction(
      () => {
        const mapId = this.adapter.mapController.dataManager.currentMapId;
        return toJS(this.customPointVisibilityData[mapId]);
      },
      () => {
        const mapId = this.adapter.mapController.dataManager.currentMapId;
        this.applyStoredVisibility(mapId);
      }
    );
    this.reactionDisposers.push(visibilityDispose);
  }

  /**
   * 初始化地图点击事件监听（用于创建自定义标点）
   */
  private initMapClickEvent() {
    const dispose = this.adapter.event.on(MAP_EVENT.MAP_CLICK, (event) => {
      if (!this.isCreating) return;
      const mapId = this.adapter.mapController.dataManager.currentMapId;
      const coordinate = event.coordinate;
      if (!coordinate) return;

      try {
        this.createCustomPoint(mapId, coordinate);
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

      const mapId = this.adapter.mapController.dataManager.currentMapId;
      try {
        this.deleteCustomPoint(mapId, instance.id);
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

  // endregion
}
