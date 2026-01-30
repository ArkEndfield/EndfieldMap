import type { CustomPointPreset, CustomPointPresetExportBundle } from '@eftypes/custom_point';
import type { Coordinate, CustomPointTypeId, EndfieldMapAdapter, EntityData, MapData } from '@endfieldmap/map-core';
import { type CustomPointData, CustomPointKey, getDefaultCustomPointType, MAP_EVENT } from '@endfieldmap/map-core';
import { LocalStorageDB, LocalStorageKey, logger, type StorageManager } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

import { alert } from '@/components/common/alert/alert_api';
import { DATA_STORAGE_KEY, EXPORT_TYPE_KEY } from '@/const/data';
import i18n from '@/i18n';
import type { CustomPointNodeSchemaType } from '@/services/data/db/schema/user_data/custom_point';
import {
  BasePresetDataService,
  type IVisibilityService,
  type VisibilityData,
} from '@/services/data/map/base/base_preset';
import { CustomPointPresetDataService } from '@/services/data/user/preset/custom_point';
import { userService } from '@/services/user';

/**
 * 自定义标点数据管理器
 */
export class CustomPointDataService extends BasePresetDataService<
  CustomPointNodeSchemaType,
  CustomPointPreset,
  CustomPointPresetExportBundle,
  CustomPointPresetDataService
> {
  private readonly adapter: EndfieldMapAdapter;

  @observable accessor customPointVisibility: boolean = true;

  @observable accessor isCreating: boolean = false;
  @observable accessor isDeleting: boolean = false;
  @observable accessor selectedPointType: CustomPointTypeId = getDefaultCustomPointType().id;

  private eventListenerDisposers: Array<() => void> = [];

  protected get exportTypeKey(): string {
    return EXPORT_TYPE_KEY.CUSTOM_POINT_PRESET;
  }

  protected get currentPresetIdKey(): string {
    return DATA_STORAGE_KEY.CURRENT_CUSTOM_POINT_PRESET_ID;
  }

  protected get visibilityService(): IVisibilityService {
    return userService.data.customPointVisibilityService;
  }

  protected get presetService(): CustomPointPresetDataService {
    return userService.data.customPointPresetDataService;
  }

  protected importVisibilityToAdapter(data: VisibilityData[]): void {
    // 转换为 plain object 传递给 Core 层
    const plainData = data.map((doc) => ({
      mapId: doc.mapId,
      entityKey: doc.entityKey,
      visible: doc.visible,
    }));
    this.adapter.customPointController.importVisibility(plainData);
  }

  protected onVisibilityChange(mapId: string, key: string, visible: boolean): void {
    this.adapter.customPointController.setMapTypeVisible(mapId, key, visible);
  }

  constructor(storage: StorageManager, adapter: EndfieldMapAdapter) {
    super(storage);
    this.adapter = adapter;
    this.initAdapter();
  }

  private initAdapter() {
    this.initMapClickEvent();
    this.initCustomPointClickEvent();
  }

  public async initFromStorage() {
    if (this.initialized) return;

    await this.initPresetFromStorage();

    const visibility = LocalStorageDB.get<boolean>(LocalStorageKey.CUSTOM_POINT_DISPLAY);

    runInAction(() => {
      this.customPointVisibility = visibility ?? true;
    });

    // 初始化可见性逻辑 (加载 + 订阅)
    await this.initVisibilityLogic();

    this.initDataListeners();
  }

  private initDataListeners() {
    userService.data.customPointPresetDataService.addNodeSubscribe((type, docData, prevData) => {
      // 先判断是不是当前预设的数据
      const currentPresetId = this.currentPresetId.value;
      if (docData.presetId !== currentPresetId) {
        return;
      }
      switch (type) {
        case 'DELETE':
          this.adapter.customPointController.deleteCustomPoint(docData.mapId, docData.levelLogicId);
          this.adapter.hoverFeatureController.clearHoverFeature();
          break;
        case 'INSERT': {
          this.adapter.customPointController.addCustomPointData(docData.mapId, docData as CustomPointData);
          break;
        }
        case 'UPDATE': {
          const manager = this.adapter.customPointController.dataManager.getMapManager(docData.mapId);
          const instance = manager.getById(docData.levelLogicId);

          if (instance && prevData) {
            // 1. 检查是否是重命名
            if (prevData.properties?.name !== docData.properties?.name) {
              instance.rename((docData.properties?.name as string) || 'Unnamed Electric Pole');
            }
            // 2. 检查是否是类型变更
            if (prevData.entityDataIdKey !== docData.entityDataIdKey) {
              instance.changeType(docData.entityDataIdKey as CustomPointTypeId);
            }
          }
          break;
        }
      }
    });
  }

  /**
   * 内部方法-应用预设到适配器
   */
  protected applyPresetToAdapter(preset: CustomPointPreset) {
    try {
      this.adapter.customPointController.loadCustomPointData(preset.data ?? []);
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
        content: i18n.t('error:custom_point.preset_corrupted', {
          defaultValue: '自定义标点预设 "{{name}}" 数据已损坏，请检查并重新创建预设。',
          name: preset.name,
        }),
        onCancel: () => {
          adapter?.customPointController.loadCustomPointData([]);
        },
        cancelText: i18n.t('error:custom_point.delete_corrupted_preset', { defaultValue: '删除损坏预设' }),
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

  // region: 修改标点的数据
  public async changePointType(
    mapId: MapData['id'],
    levelLogicId: EntityData['levelLogicId'],
    newType: CustomPointTypeId
  ) {
    const presetId = this.currentPresetId.value;
    if (!presetId) {
      logger.warn('[CustomPointDataService|changePointType] No preset selected');
      return;
    }

    try {
      await this.presetService.changeNodeType(mapId, presetId, levelLogicId, newType);
    } catch (error) {
      logger.error('[CustomPointDataService|changePointType] Failed to change point type', error);
      throw error;
    }
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

    const currentPresetId = this.currentPresetId.value;
    if (!currentPresetId) {
      alert.info({
        content: i18n.t('error:custom_point.no_preset_selected', {
          defaultValue: '未选择自定义标点预设，无法创建标点，请先创建或选择预设。',
        }),
      });
      return;
    }

    // 创建前确保该类型可见
    await this.updateItemVisibility(mapId, this.selectedPointType, true);

    try {
      const data = this.adapter.customPointController.createCustomPointData(mapId, coordinate, this.selectedPointType);
      if (data) {
        await userService.data.customPointPresetDataService.createNode(mapId, currentPresetId, data);
      }
    } catch (error) {
      logger.error('[CustomPointDataService|createCustomPoint] Failed to create custom point', error);
      alert.info({
        content: i18n.t('error:custom_point.create_failed', {
          defaultValue: '创建失败：{{message}}',
          message: error instanceof Error ? error.message : String(error),
        }),
      });
    }
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

    const presetId = this.currentPresetId.value;
    if (!presetId) return;

    await userService.data.customPointPresetDataService.deleteNode(mapId, presetId, id);
  }
  // endregion

  // region: 自定义标点事件初始化

  /**
   * 初始化地图点击事件监听（用于创建自定义标点）
   */
  private initMapClickEvent() {
    const dispose = this.adapter.event.on(MAP_EVENT.MAP_CLICK, async (event) => {
      if (!this.isCreating) return;
      const mapId = this.adapter.mapController.dataManager.currentMapId;
      const coordinate = event.coordinate;
      if (!coordinate) return;

      try {
        await this.createCustomPoint(mapId, coordinate);
      } catch (error) {
        logger.error('[CustomPointDataService|initMapClickEvent] Failed to create custom point', error);
        alert.info({
          content: i18n.t('error:custom_point.create_failed', {
            defaultValue: '创建失败：{{message}}',
            message: error instanceof Error ? error.message : String(error),
          }),
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
    const dispose = this.adapter.event.on(MAP_EVENT.ENTITY_CLICK, async (event) => {
      if (!this.isDeleting) return;
      const instance = event.instance;
      const isCustomPoint = instance.entityInfo.category === CustomPointKey;
      if (!isCustomPoint) return;

      const mapId = this.adapter.mapController.dataManager.currentMapId;
      try {
        await this.deleteCustomPoint(mapId, instance.id);
        // 清除 hover 状态
        this.adapter.hoverFeatureController.clearHoverFeature();
      } catch (error) {
        logger.error('[CustomPointDataService|initCustomPointClickEvent] Failed to delete custom point', error);
        alert.info({
          content: i18n.t('error:custom_point.delete_failed', {
            defaultValue: '删除失败：{{message}}',
            message: error instanceof Error ? error.message : String(error),
          }),
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
}
