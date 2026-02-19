import type {
  CustomPointData,
  CustomPointTypeId,
  EntityData,
  MapCoordinate,
  MapData,
} from '@endfieldmap/map-core';
import { CustomPointKey, getDefaultCustomPointType, MAP_EVENT } from '@endfieldmap/map-core';
import type { CustomPointPreset, CustomPointPresetExportBundle } from '@endfieldmap/map-service/@types/custom_point';
import type {
  ICustomPointPresetDataService,
  IVisibilityService,
  PresetSubscribeCallback,
} from '@endfieldmap/map-service/@types/preset_base';
import { DATA_STORAGE_KEY, EXPORT_TYPE_KEY } from '@endfieldmap/map-service/const/data';
import {
  BasePresetDataService,
  type BasePresetDataServiceDeps,
  type VisibilityData,
} from '@endfieldmap/map-service/service/data/map/base/base_preset';
import type { CustomPointNodeSchemaType } from '@endfieldmap/map-service/service/db/export';
import { PresetService } from '@endfieldmap/map-service/service/preset_service';
import { serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { SERVICE_EVENT } from '@endfieldmap/map-service/service/service_emitter';
import { LocalStorageDB, LocalStorageKey, logger } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

export interface CustomPointDataServiceDeps extends BasePresetDataServiceDeps {
  customPointVisibilityService: IVisibilityService;
  customPointPresetDataService: ICustomPointPresetDataService<CustomPointPreset, CustomPointNodeSchemaType>;
  presetService: PresetService;
}

/**
 * 自定义标点数据管理器
 */
export class CustomPointDataService extends BasePresetDataService<
  CustomPointNodeSchemaType,
  CustomPointPreset,
  CustomPointPresetExportBundle,
  ICustomPointPresetDataService<CustomPointPreset, CustomPointNodeSchemaType>,
  CustomPointDataServiceDeps
> {
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
    return this.deps.customPointVisibilityService;
  }

  protected get presetDataService(): ICustomPointPresetDataService<CustomPointPreset, CustomPointNodeSchemaType> {
    return this.deps.customPointPresetDataService;
  }

  protected importVisibilityToAdapter(data: VisibilityData[]): void {
    const plainData = data.map((doc) => ({
      mapId: doc.mapId,
      entityKey: doc.entityKey,
      visible: doc.visible,
    }));
    this.deps.adapterRegistry.adapter.customPointController.importVisibility(plainData);
  }

  protected onVisibilityChange(mapId: string, key: string, visible: boolean): void {
    this.deps.adapterRegistry.adapter.customPointController.setMapTypeVisible(mapId, key, visible);
  }

  constructor(deps: CustomPointDataServiceDeps) {
    super(deps);
  }

  public async init() {
    this.initMapClickEvent();
    this.initCustomPointClickEvent();
    await this.initFromStorage();
  }

  public async initFromStorage() {
    await this.initPresetFromStorage();

    const visibility = LocalStorageDB.get<boolean>(LocalStorageKey.CUSTOM_POINT_DISPLAY);

    runInAction(() => {
      this.customPointVisibility = visibility ?? true;
    });

    await this.initVisibilityLogic();
    this.initDataListeners();
  }

  private translate(key: string, options?: Record<string, unknown>): string {
    return this.deps.i18nService.translate(key, options);
  }

  private initDataListeners() {
    this.deps.customPointPresetDataService.addNodeSubscribe((type, docData, prevData) => {
      const currentPresetId = this.currentPresetId.value;
      if (docData.presetId !== currentPresetId) {
        return;
      }
      switch (type) {
        case 'DELETE':
          this.deps.adapterRegistry.adapter.customPointController.deleteCustomPoint(docData.mapId, docData.levelLogicId);
          this.deps.adapterRegistry.adapter.hoverFeatureController.clearHoverFeature();
          break;
        case 'INSERT': {
          this.deps.adapterRegistry.adapter.customPointController.addCustomPointData(docData.mapId, docData as CustomPointData);
          break;
        }
        case 'UPDATE': {
          const manager = this.deps.adapterRegistry.adapter.customPointController.dataManager.getMapManager(docData.mapId);
          const instance = manager.getById(docData.levelLogicId);

          if (instance && prevData) {
            if (prevData.properties?.name !== docData.properties?.name) {
              instance.rename((docData.properties?.name as string) || 'Unnamed Electric Pole');
            }
            if (prevData.entityDataIdKey !== docData.entityDataIdKey) {
              instance.changeType(docData.entityDataIdKey as CustomPointTypeId);
            }
          }
          break;
        }
      }
    });

    this.deps.customPointPresetDataService.addPresetSubscribe(
      ((type: string, docData: { id: string }) => {
        if (type === 'DELETE' && docData.id === this.currentPresetId.value) {
          this.reset();
        }
      }) as PresetSubscribeCallback
    );
  }

  protected applyPresetToAdapter(preset: CustomPointPreset) {
    try {
      this.deps.adapterRegistry.adapter.customPointController.loadCustomPointData(preset.data ?? []);
    } catch (error) {
      logger.error(
        '[CustomPointDataService|applyPresetToAdapter] Failed to apply preset, falling back to empty data',
        {
          presetId: preset.id,
          presetName: preset.name,
          error,
          preset: preset,
        }
      );

      const adapter = this.deps.adapterRegistry.adapter;
      serviceEmitter.fire(SERVICE_EVENT.ALERT_SHOW, {
        content: this.translate('error:custom_point.preset_corrupted', {
          defaultValue: '自定义标点预设 "{{name}}" 数据已损坏，请检查并重新创建预设。',
          name: preset.name,
        }),
        onCancel: () => {
          adapter?.customPointController.loadCustomPointData([]);
        },
      });
    }
  }

  public clearActiveFeature() {
    this.deps.adapterRegistry.adapter.activeFeatureController?.clearActiveFeature?.();
  }

  @action
  public setCreating(creating: boolean) {
    this.isCreating = creating;
    if (creating) {
      this.clearActiveFeature();
    }
  }

  @action
  public setDeleting(deleting: boolean) {
    this.isDeleting = deleting;
    if (deleting) {
      this.clearActiveFeature();
    }
  }

  @computed
  public get isInCustomPointOperateMode() {
    return this.isCreating || this.isDeleting;
  }

  @action
  public stopAllOperation() {
    this.setCreating(false);
    this.setDeleting(false);
  }

  @action
  public setSelectedPointType(pointType: CustomPointTypeId) {
    this.selectedPointType = pointType;
  }

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
      await this.presetDataService.changeNodeType(mapId, presetId, levelLogicId, newType);
    } catch (error) {
      logger.error('[CustomPointDataService|changePointType] Failed to change point type', error);
      throw error;
    }
  }

  @action
  public changeVisibility(visible: boolean) {
    this.deps.adapterRegistry.adapter.customPointController?.setCustomPointVisible?.(visible);
    this.customPointVisibility = visible;
    LocalStorageDB.set(LocalStorageKey.CUSTOM_POINT_DISPLAY, visible);
  }

  @action
  public toggleVisibility() {
    const visible = !this.deps.adapterRegistry.adapter.customPointController.dataManager.visible;
    this.changeVisibility(visible);
  }

  public async createCustomPoint(mapId: MapData['id'], coordinate: MapCoordinate) {
    const currentPresetId = this.currentPresetId.value;
    if (!currentPresetId) {
      serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
        content: this.translate('error:custom_point.no_preset_selected', {
          defaultValue: '未选择自定义标点预设，无法创建标点，请先创建或选择预设。',
        }),
      });
      return;
    }

    await this.updateItemVisibility(mapId, this.selectedPointType, true);

    try {
      const data = this.deps.adapterRegistry.adapter.customPointController.createCustomPointData(mapId, coordinate, this.selectedPointType);
      if (data) {
        await this.deps.customPointPresetDataService.createNode(mapId, currentPresetId, data);
      }
    } catch (error) {
      logger.error('[CustomPointDataService|createCustomPoint] Failed to create custom point', error);
      serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
        content: this.translate('error:custom_point.create_failed', {
          defaultValue: '创建失败：{{message}}',
          message: error instanceof Error ? error.message : String(error),
        }),
      });
    }
  }

  public async deleteCustomPoint(mapId: MapData['id'], id: number) {
    const presetId = this.currentPresetId.value;
    if (!presetId) return;

    await this.deps.customPointPresetDataService.deleteNode(mapId, presetId, id);
  }

  public override sharePresetToServer(data: CustomPointNodeSchemaType[], name: string, description: string) {
    return this.deps.presetService.shareCustomPointPreset(name, description, data);
  }

  private initMapClickEvent() {
    const dispose = this.deps.adapterRegistry.adapter.event.on(MAP_EVENT.MAP_CLICK, async (event) => {
      if (!this.isCreating) return;
      const mapId = this.deps.adapterRegistry.adapter.mapController.dataManager.currentMapId;
      const coordinate = event.coordinate;
      if (!coordinate) return;

      try {
        await this.createCustomPoint(mapId, coordinate);
      } catch (error) {
        logger.error('[CustomPointDataService|initMapClickEvent] Failed to create custom point', error);
        serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
          content: this.translate('error:custom_point.create_failed', {
            defaultValue: '创建失败：{{message}}',
            message: error instanceof Error ? error.message : String(error),
          }),
        });
      }
    });
    this.eventListenerDisposers.push(dispose);
  }

  private initCustomPointClickEvent() {
    if (!this.deps.adapterRegistry.adapter) return;
    const dispose = this.deps.adapterRegistry.adapter.event.on(MAP_EVENT.ENTITY_CLICK, async (event) => {
      if (!this.isDeleting) return;
      const instance = event.instance;
      const isCustomPoint = instance.entityInfo.category === CustomPointKey;
      if (!isCustomPoint) return;

      const mapId = this.deps.adapterRegistry.adapter.mapController.dataManager.currentMapId;
      try {
        await this.deleteCustomPoint(mapId, instance.id);
        this.deps.adapterRegistry.adapter.hoverFeatureController.clearHoverFeature();
      } catch (error) {
        logger.error('[CustomPointDataService|initCustomPointClickEvent] Failed to delete custom point', error);
        serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
          content: this.translate('error:custom_point.delete_failed', {
            defaultValue: '删除失败：{{message}}',
            message: error instanceof Error ? error.message : String(error),
          }),
        });
      }
    });
    this.eventListenerDisposers.push(dispose);
  }

  public dispose() {
    this.eventListenerDisposers.forEach((dispose) => dispose());
    this.eventListenerDisposers = [];
  }

  public override reset() {
    this.stopAllOperation();
    super.reset();
  }
}
