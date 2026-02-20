import type { MapCoordinate } from '@endfieldmap/map-core';
import type { ElectricPoleData, ElectricPoleDeviceKey } from '@endfieldmap/map-core';
import {
  DEFAULT_ELECTRIC_POLE_DEVICE_KEY,
  ElectricPoleDataInstance,
  getElectricPoleDeviceConfig,
  isSameElectricPoleConnectionType,
  MAP_EVENT,
} from '@endfieldmap/map-core';
import type { ElectricMode,ElectricPolePreset, ElectricPolePresetExportBundle } from '@endfieldmap/map-service/@types/electric_pole';
import type {
  IElectricPolePresetDataService,
  IVisibilityService,
  PresetSubscribeCallback,
} from '@endfieldmap/map-service/@types/preset_base';
import type { ElectricPoleType } from '@endfieldmap/map-service/@types/preset_store';
import { DATA_STORAGE_KEY, EXPORT_TYPE_KEY } from '@endfieldmap/map-service/const/data';
import { modes } from '@endfieldmap/map-service/const/electric_pole';
import {
  BasePresetDataService,
  type BasePresetDataServiceDeps,
  type VisibilityData,
} from '@endfieldmap/map-service/service/data/map/base/base_preset';
import type { ElectricPoleNodeSchemaType } from '@endfieldmap/map-service/service/db/export';
import { PresetService } from '@endfieldmap/map-service/service/preset_service';
import { serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { SERVICE_EVENT } from '@endfieldmap/map-service/service/service_emitter';
import { calculateDistance, ElectricPoleError, LocalStorageDB, LocalStorageKey, logger } from '@endfieldmap/tools';
import diff from 'microdiff';
import { action, computed, observable, reaction } from 'mobx';

/**
 * 获取电线杆错误的 i18n 消息
 */
function getElectricPoleErrorMessage(
  error: unknown,
  translate: (key: string, options?: Record<string, unknown>) => string
): string {
  if (error instanceof ElectricPoleError) {
    return translate(`error:electric_pole.${error.i18nKey}`, {
      defaultValue: error.message,
    });
  }
  return error instanceof Error ? error.message : String(error);
}

export interface ElectricPoleDataServiceDeps extends BasePresetDataServiceDeps {
  electricPoleVisibilityService: IVisibilityService;
  electricPolePresetDataService: IElectricPolePresetDataService<ElectricPolePreset, ElectricPoleNodeSchemaType>;
  presetService: PresetService;
}

/**
 * 电线杆数据管理器
 */
export class ElectricPoleDataService extends BasePresetDataService<
  ElectricPoleNodeSchemaType,
  ElectricPolePreset,
  ElectricPolePresetExportBundle,
  IElectricPolePresetDataService<ElectricPolePreset, ElectricPoleNodeSchemaType>,
  ElectricPoleDataServiceDeps
> {
  protected get currentPresetIdKey(): string {
    return DATA_STORAGE_KEY.CURRENT_ELECTRIC_POLE_PRESET_ID;
  }

  protected get exportTypeKey(): string {
    return EXPORT_TYPE_KEY.ELECTRIC_POLE_PRESET;
  }

  protected get visibilityService(): IVisibilityService {
    return this.deps.electricPoleVisibilityService;
  }

  protected get presetDataService(): IElectricPolePresetDataService<ElectricPolePreset, ElectricPoleNodeSchemaType> {
    return this.deps.electricPolePresetDataService;
  }

  protected importVisibilityToAdapter(data: VisibilityData[]): void {
    this.deps.adapterRegistry.adapter.electricPoleController.importVisibility(data);
  }

  protected onVisibilityChange(mapId: string, key: string, visible: boolean): void {
    this.deps.adapterRegistry.adapter.electricPoleController.setMapDeviceVisible(mapId, key as ElectricPoleDeviceKey, visible);
  }

  @observable accessor isCreating: boolean = false;
  @observable accessor creatingDeviceKey: ElectricPoleDeviceKey = DEFAULT_ELECTRIC_POLE_DEVICE_KEY;
  @observable accessor autoConnect: boolean = true;

  @observable accessor isConnecting: boolean = false;
  private connectingPole: ElectricPoleDataInstance | null = null;

  @observable accessor isDeleting: boolean = false;
  @observable accessor isDeletingConnection: boolean = false;

  private connectionClickEventInitialized: boolean = false;

  constructor(deps: ElectricPoleDataServiceDeps) {
    super(deps);
  }

  public async init() {
    this.initEntityClickEvent();
    this.initElectricPoleClickEvent();
    reaction(
      () => this.deps.adapterRegistry.adapter.mapController.dataManager.currentMapId,
      () => {
        if (this.connectingPole) {
          this.connectingPole = null;
          this.deps.adapterRegistry.adapter.activeFeatureController.clearActiveFeature();
        }
      },
      { fireImmediately: true }
    );
    await this.initFromStorage();
  }

  public async initFromStorage() {
    await this.initPresetFromStorage();
    await this.initVisibilityLogic();
    this.initDataListeners();
  }

  @action
  public clearActiveFeature() {
    this.deps.adapterRegistry.adapter.activeFeatureController?.clearActiveFeature?.();
    this.connectingPole = null;
    this.isConnecting = false;
  }

  private translate(...args: Parameters<typeof this.deps.i18nService.translate>): string {
    return this.deps.i18nService.translate(key, options);
  }

  private initDataListeners() {
    this.deps.electricPolePresetDataService.addNodeSubscribe((type, docData, prevData) => {
      const currentPresetId = this.currentPresetId.value;
      if (docData.presetId !== currentPresetId) {
        return;
      }
      switch (type) {
        case 'DELETE':
          this.deps.adapterRegistry.adapter.electricPoleController.deleteElectricPole(docData.mapId, docData.levelLogicId);
          this.deps.adapterRegistry.adapter.hoverFeatureController.clearHoverFeature();
          break;
        case 'INSERT': {
          const feature = this.deps.adapterRegistry.adapter.electricPoleController.addElectricPoleData(
            docData.mapId,
            docData as unknown as ElectricPoleData
          );

          if (feature && this.autoConnect) {
            this.innerConnectElectricPole(feature);
          }
          break;
        }
        case 'UPDATE': {
          if (!prevData) break;
          const prevConnections: ElectricPoleData['levelLogicId'][] =
            (prevData.properties?.connections as ElectricPoleData['levelLogicId'][]) ?? [];
          const currConnections: ElectricPoleData['levelLogicId'][] =
            (docData.properties?.connections as ElectricPoleData['levelLogicId'][]) ?? [];

          const manager = this.deps.adapterRegistry.adapter.electricPoleController.dataManager.getMapManager(docData.mapId);
          const instance = manager.getById(docData.levelLogicId);
          if (instance) {
            const connectionChanges = diff(prevConnections, currConnections);
            connectionChanges.forEach((change) => {
              if (change.type === 'CREATE') {
                const newTargetId = change.value;
                const targetInstance = manager.getById(newTargetId);
                if (targetInstance) {
                  this.deps.adapterRegistry.adapter.electricPoleController.connectElectricPoles(
                    docData.mapId,
                    docData.levelLogicId,
                    newTargetId
                  );
                }
                return;
              }
              if (change.type === 'REMOVE') {
                const removedTargetId = change.oldValue;
                this.deps.adapterRegistry.adapter.electricPoleController.disconnectElectricPoles(
                  docData.mapId,
                  docData.levelLogicId,
                  removedTargetId
                );
                this.deps.adapterRegistry.adapter.hoverConnectionController.clearHoverConnection();
                return;
              }
              if (change.type === 'CHANGE') {
                const newTargetId = change.value;
                const oldTargetId = change.oldValue;
                this.deps.adapterRegistry.adapter.electricPoleController.disconnectElectricPoles(
                  docData.mapId,
                  docData.levelLogicId,
                  oldTargetId
                );
                const targetInstance = manager.getById(newTargetId);
                if (targetInstance) {
                  this.deps.adapterRegistry.adapter.electricPoleController.connectElectricPoles(
                    docData.mapId,
                    docData.levelLogicId,
                    newTargetId
                  );
                }
              }
            });
            if (prevData.properties?.name !== docData.properties?.name) {
              instance.rename((docData.properties?.name as string) || 'Unnamed Electric Pole');
            }
          }
          break;
        }
      }
    });

    this.deps.electricPolePresetDataService.addPresetSubscribe(
      ((type: string, docData: { id: string }) => {
        if (type === 'DELETE' && docData.id === this.currentPresetId.value) {
          this.reset();
        }
      }) as PresetSubscribeCallback
    );
  }

  @action
  public changeZoneVisibility(visible: boolean) {
    this.deps.adapterRegistry.adapter.electricPoleController?.setZoneVisible?.(visible);
    LocalStorageDB.set(LocalStorageKey.ELECTRIC_POLE_RANGE_DISPLAY, visible);
  }

  @action
  public toggleZoneVisibility() {
    const visible = !this.deps.adapterRegistry.adapter.electricPoleController.dataManager.zoneVisible;
    this.changeZoneVisibility(visible);
  }

  @action
  public changeVisibility(visible: boolean) {
    this.deps.adapterRegistry.adapter.electricPoleController?.setVisible?.(visible);
    LocalStorageDB.set(LocalStorageKey.ELECTRIC_POLE_DISPLAY, visible);
  }

  @action
  public toggleVisibility() {
    const visible = !this.deps.adapterRegistry.adapter.electricPoleController.dataManager.visible;
    this.changeVisibility(visible);
  }

  private initEntityClickEvent() {
    this.deps.adapterRegistry.adapter.event.on(MAP_EVENT.MAP_CLICK, async (event) => {
      if (!this.isCreating) return;
      await this.createElectricPole(event.coordinate);
    });
  }

  public async createElectricPole(coordinate: MapCoordinate) {
    const mapId = this.deps.adapterRegistry.adapter.mapController.dataManager.currentMapId;
    const type = this.creatingDeviceKey;
    const currentPresetId = this.currentPresetId.value;
    if (!currentPresetId) {
      serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
        content: this.translate('error:electric_pole.no_preset_selected', {
          defaultValue: '未选择电线杆预设，无法创建电线杆，请先创建或选择预设。',
        }),
      });
      return;
    }
    try {
      await this.updateItemVisibility(mapId, this.creatingDeviceKey, true);
      const data = this.deps.adapterRegistry.adapter.electricPoleController.createElectricPoleData(mapId, coordinate, type);
      if (data) {
        await this.deps.electricPolePresetDataService.createNode(mapId, currentPresetId, data);
      }
    } catch (error) {
      const errorMsg = getElectricPoleErrorMessage(error, this.translate.bind(this));
      serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
        content: this.translate('error:electric_pole.create_failed', {
          defaultValue: '创建失败：{{message}}',
          message: errorMsg,
        }),
      });
    }
  }

  @action
  public setModeState(mode: ElectricMode, enable: boolean) {
    switch (mode) {
      case 'isDeleting':
        this.isDeleting = enable;
        if (enable) {
          this.clearActiveFeature();
        }
        break;
      case 'isCreating':
        this.isCreating = enable;
        if (enable && this.autoConnect) {
          this.setActiveFeatureToConnectingPole();
        } else {
          this.setModeState('isConnecting', false);
        }
        break;
      case 'isConnecting':
        this.isConnecting = enable;
        if (enable) {
          this.setActiveFeatureToConnectingPole();
        } else {
          this.connectingPole = null;
        }
        break;
      case 'isDeletingConnection':
        this.isDeletingConnection = enable;
        if (enable) {
          this.initConnectionClickEvent();
          this.clearActiveFeature();
        }
        break;
    }
  }

  @computed
  public get isInElectricOperateMode() {
    return modes.some((mode) => this[mode]);
  }

  @action
  public stopAllOperation() {
    modes.forEach((mode) => {
      this.setModeState(mode, false);
    });
  }

  @action
  public toggleAutoConnect() {
    this.autoConnect = !this.autoConnect;
  }

  @action
  public setCreatingDeviceKey(key: ElectricPoleDeviceKey) {
    this.creatingDeviceKey = key;
  }

  @action
  public deleteElectricPole(pole: ElectricPoleDataInstance, force = false) {
    if (!this.isDeleting && !force) return;
    const presetId = this.currentPresetId.value;
    if (!presetId) return;
    this.deps.electricPolePresetDataService.deleteNode(pole.mapId, presetId, pole.id);
  }

  private initElectricPoleClickEvent() {
    this.deps.adapterRegistry.adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
      if (!this.isDeleting) return;
      const instance = event.instance;
      if (!(instance instanceof ElectricPoleDataInstance)) return;
      this.deleteElectricPole(instance);
    });
  }

  @action
  public deleteConnection(fromInstance: ElectricPoleDataInstance, targetId: number) {
    if (!this.isDeletingConnection) return;

    const presetId = this.currentPresetId.value;
    if (!presetId) return;

    this.deps.electricPolePresetDataService.disconnectPoles(fromInstance.mapId, presetId, fromInstance.id, targetId);
  }

  private initConnectionClickEvent() {
    if (this.connectionClickEventInitialized) return;
    this.connectionClickEventInitialized = true;

    this.deps.adapterRegistry.adapter.event.on(MAP_EVENT.CONNECTION_CLICK, (event) => {
      if (!this.isDeletingConnection) return;
      this.deleteConnection(event.instance, event.targetId);
    });
  }

  @action
  public setActiveFeatureToConnectingPole() {
    const activeFeature = this.deps.adapterRegistry.adapter.activeFeatureController?.activeFeature;
    if (!activeFeature || !(activeFeature instanceof ElectricPoleDataInstance)) {
      this.connectingPole = null;
      this.deps.adapterRegistry.adapter.activeFeatureController?.clearActiveFeature?.();
      return;
    }
    this.setConnectingPole(activeFeature);
  }

  @action
  public setConnectingPole(pole: ElectricPoleDataInstance) {
    this.connectingPole = pole;
    requestAnimationFrame(() => {
      this.deps.adapterRegistry.adapter.activeFeatureController?.setActiveFeature?.(pole);
    });
  }

  public connectElectricPole(pole: ElectricPoleDataInstance) {
    if (!this.isConnecting) return;
    this.innerConnectElectricPole(pole);
  }

  private innerConnectElectricPole(pole: ElectricPoleDataInstance) {
    if (this.connectingPole) {
      try {
        if (this.connectingPole === pole) return;

        if (this.connectingPole.isConnectedTo(pole.id)) {
          throw new ElectricPoleError('already_connected', this.connectingPole.id);
        }

        const fromDeviceKey = this.connectingPole.deviceKey;
        const toDeviceKey = pole.deviceKey;
        if (!isSameElectricPoleConnectionType(fromDeviceKey, toDeviceKey)) {
          throw new ElectricPoleError('different_connection_type', this.connectingPole.id);
        }

        const fromLimit = getElectricPoleDeviceConfig(fromDeviceKey).maxConnections;
        if (fromLimit !== false && this.connectingPole.connectionCount >= fromLimit) {
          throw new ElectricPoleError('source_slots_full', this.connectingPole.id);
        }

        const toLimit = getElectricPoleDeviceConfig(toDeviceKey).maxConnections;
        if (toLimit !== false && pole.connectionCount >= toLimit) {
          throw new ElectricPoleError('target_slots_full', pole.id);
        }

        const distance = calculateDistance(this.connectingPole.coordinates, pole.coordinates);
        if (distance > this.connectingPole.zoneRadius) {
          throw new ElectricPoleError('distance_too_far', this.connectingPole.id);
        }

        const presetId = this.currentPresetId.value;
        if (!presetId) return;

        this.deps.electricPolePresetDataService.connectPoles(
          this.connectingPole.mapId,
          presetId,
          this.connectingPole.id,
          pole.id
        );

        this.setConnectingPole(pole);
      } catch (error) {
        const errorMsg = getElectricPoleErrorMessage(error, this.translate.bind(this));
        serviceEmitter.fire(SERVICE_EVENT.ALERT_SHOW, {
          content: this.translate('error:electric_pole.connect_failed_with_switch', {
            defaultValue: `连接失败：${errorMsg}，点击切换将当前连接的电线杆切换为点击的电线杆`,
            message: errorMsg,
          }),
          onCancel: () => {
            this.setConnectingPole(pole);
          },
        });
      }
    } else {
      this.setConnectingPole(pole);
    }
  }

  public override sharePresetToServer(
    data: ElectricPoleNodeSchemaType[],
    name: string,
    description: string,
    type: ElectricPoleType = 'pole'
  ) {
    return this.deps.presetService.shareElectricPolePreset(name, description, type, data);
  }

  protected applyPresetToAdapter(preset: ElectricPolePreset) {
    try {
      this.deps.adapterRegistry.adapter.electricPoleController.loadElectricPoleData(preset.data ?? []);
    } catch (error) {
      logger.error(
        '[ElectricPoleDataService|applyPresetToAdapter] Failed to apply preset, falling back to empty data',
        {
          presetId: preset.id,
          presetName: preset.name,
          error,
          preset: preset,
        }
      );

      const adapter = this.deps.adapterRegistry.adapter;
      serviceEmitter.fire(SERVICE_EVENT.ALERT_SHOW, {
        content: this.translate('error:electric_pole.preset_corrupted', {
          defaultValue: '电线杆预设 "{{name}}" 数据已损坏，请检查并重新创建预设。',
          name: preset.name,
        }),
        onCancel: () => {
          adapter?.electricPoleController.loadElectricPoleData([]);
        },
      });
    }
  }

  public override reset() {
    this.stopAllOperation();
    super.reset();
  }
}
