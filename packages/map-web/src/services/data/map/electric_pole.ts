import type { ElectricMode, ElectricPolePreset, ElectricPolePresetExportBundle } from '@eftypes/electric_pole';
import type { ElectricPoleData, EndfieldMapAdapter } from '@endfieldmap/map-core';
import {
  type Coordinate,
  DEFAULT_ELECTRIC_POLE_DEVICE_KEY,
  ElectricPoleDataInstance,
  type ElectricPoleDeviceKey,
  ElectricPoleKey,
  getElectricPoleDeviceConfig,
  isSameElectricPoleConnectionType,
  MAP_EVENT,
} from '@endfieldmap/map-core';
import {
  calculateDistance,
  ElectricPoleError,
  LocalStorageDB,
  LocalStorageKey,
  logger,
  type StorageManager,
} from '@endfieldmap/tools';
import diff from 'microdiff';
import { action, computed, observable, reaction } from 'mobx';

import { alert } from '@/components/common/alert/alert_api';
import { DATA_STORAGE_KEY, EXPORT_TYPE_KEY } from '@/const/data';
import { modes } from '@/const/electric_pole';
import i18n from '@/i18n';
import type { ElectricPoleNodeSchemaType } from '@/services/data/db/schema/user_data/electric_pole';
import {
  BasePresetDataService,
  type IVisibilityService,
  type VisibilityData,
} from '@/services/data/map/base/base_preset';
import { ElectricPolePresetDataService } from '@/services/data/user/preset/electric_pole';
import { userService } from '@/services/user';

/**
 * 获取电线杆错误的 i18n 消息
 */
function getElectricPoleErrorMessage(error: unknown): string {
  if (error instanceof ElectricPoleError) {
    return i18n.t(`error:electric_pole.${error.i18nKey}`, {
      defaultValue: error.message,
    });
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * 电线杆数据管理器
 */
export class ElectricPoleDataService extends BasePresetDataService<
  ElectricPoleNodeSchemaType,
  ElectricPolePreset,
  ElectricPolePresetExportBundle,
  ElectricPolePresetDataService
> {
  private readonly adapter: EndfieldMapAdapter;

  protected get currentPresetIdKey(): string {
    return DATA_STORAGE_KEY.CURRENT_ELECTRIC_POLE_PRESET_ID;
  }

  protected get exportTypeKey(): string {
    return EXPORT_TYPE_KEY.ELECTRIC_POLE_PRESET;
  }

  protected get visibilityService(): IVisibilityService {
    return userService.data.electricPoleVisibilityService;
  }

  protected get presetService(): ElectricPolePresetDataService {
    return userService.data.electricPolePresetDataService;
  }

  protected importVisibilityToAdapter(data: VisibilityData[]): void {
    this.adapter.electricPoleController.importVisibility(data);
  }

  protected onVisibilityChange(mapId: string, key: string, visible: boolean): void {
    this.adapter.electricPoleController.setMapDeviceVisible(mapId, key as ElectricPoleDeviceKey, visible);
  }

  /** 是否处于创建电线杆状态 */
  @observable accessor isCreating: boolean = false;
  /** 创建时的类型 */
  @observable accessor creatingDeviceKey: ElectricPoleDeviceKey = DEFAULT_ELECTRIC_POLE_DEVICE_KEY;
  /** 是否自动连接连续创建的电线杆 */
  @observable accessor autoConnect: boolean = true;

  /** 是否处于连接电线杆状态 */
  @observable accessor isConnecting: boolean = false;
  private connectingPole: ElectricPoleDataInstance | null = null;

  /** 是否处于删除电线杆状态 */
  @observable accessor isDeleting: boolean = false;

  /** 是否处于删除连线状态 */
  @observable accessor isDeletingConnection: boolean = false;

  /** 连线点击事件是否已初始化 */
  private connectionClickEventInitialized: boolean = false;

  constructor(storage: StorageManager, adapter: EndfieldMapAdapter) {
    super(storage);
    this.adapter = adapter;
    this.initAdapter();
  }

  /**
   * 注册地图适配器
   */
  private initAdapter() {
    this.initEntityClickEvent();
    this.initElectricPoleClickEvent();
    // 监听地图切换，清除当正在连接的电线杆
    reaction(
      () => this.adapter.mapController.dataManager.currentMapId,
      () => {
        if (this.connectingPole) {
          this.connectingPole = null;
          this.adapter.activeFeatureController.clearActiveFeature();
        }
      },
      { fireImmediately: true }
    );
  }

  // region: 数据处理和获取

  public async initFromStorage() {
    if (this.initialized) return;

    await this.initPresetFromStorage();

    // 初始化可见性逻辑 (加载 + 订阅)
    await this.initVisibilityLogic();

    this.initDataListeners();
  }

  @action
  public clearActiveFeature() {
    this.adapter.activeFeatureController?.clearActiveFeature?.();
    this.connectingPole = null;
    this.isConnecting = false;
  }

  private initDataListeners() {
    userService.data.electricPolePresetDataService.addNodeSubscribe((type, docData, prevData) => {
      // 先判断是不是当前预设的数据
      const currentPresetId = this.currentPresetId.value;
      if (docData.presetId !== currentPresetId) {
        return;
      }
      switch (type) {
        case 'DELETE':
          this.adapter.electricPoleController.deleteElectricPole(docData.mapId, docData.levelLogicId);
          this.adapter.hoverFeatureController.clearHoverFeature();
          break;
        case 'INSERT': {
          const feature = this.adapter.electricPoleController.addElectricPoleData(
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

          const manager = this.adapter.electricPoleController.dataManager.getMapManager(docData.mapId);
          const instance = manager.getById(docData.levelLogicId);
          if (instance) {
            // 1. 检查是否是连接变化
            const connectionChanges = diff(prevConnections, currConnections);
            connectionChanges.forEach((change) => {
              if (change.type === 'CREATE') {
                const newTargetId = change.value;
                const targetInstance = manager.getById(newTargetId);
                if (targetInstance) {
                  instance.connectTo(targetInstance);
                }
                return;
              }
              if (change.type === 'REMOVE') {
                const removedTargetId = change.oldValue;
                instance.disconnectOutgoingTo(removedTargetId);
                this.adapter.hoverConnectionController.clearHoverConnection();
                return;
              }
              if (change.type === 'CHANGE') {
                const newTargetId = change.value;
                const oldTargetId = change.oldValue;
                instance.disconnectOutgoingTo(oldTargetId);
                const targetInstance = manager.getById(newTargetId);
                if (targetInstance) {
                  instance.connectTo(targetInstance);
                }
              }
            });
            // 2. 检查是否是重命名
            if (prevData.properties?.name !== docData.properties?.name) {
              instance.rename((docData.properties?.name as string) || 'Unnamed Electric Pole');
            }
          }
          break;
        }
      }
    });
  }

  // endregion

  // region: 可见性管理
  /**
   * 修改电线杆范围是否可见
   * @param visible
   */
  @action
  public changeZoneVisibility(visible: boolean) {
    this.adapter.electricPoleController?.setZoneVisible?.(visible);
    LocalStorageDB.set(LocalStorageKey.ELECTRIC_POLE_RANGE_DISPLAY, visible);
  }

  /**
   * 切换电线杆范围可见性
   */
  @action
  public toggleZoneVisibility() {
    const visible = !this.adapter.electricPoleController.dataManager.zoneVisible;
    this.changeZoneVisibility(visible);
  }

  /**
   * 修改电线杆可见性
   */
  @action
  public changeVisibility(visible: boolean) {
    this.adapter.electricPoleController?.setVisible?.(visible);
    LocalStorageDB.set(LocalStorageKey.ELECTRIC_POLE_DISPLAY, visible);
  }

  /**
   * 切换电线杆可见性
   */
  @action
  public toggleVisibility() {
    const visible = !this.adapter.electricPoleController.dataManager.visible;
    this.changeVisibility(visible);
  }

  // endregion

  // region: 事件注册
  private initEntityClickEvent() {
    this.adapter.event.on(MAP_EVENT.MAP_CLICK, async (event) => {
      if (!this.isCreating) return;
      await this.createElectricPole(event.coordinate);
    });
  }

  // endregion

  // region: 创建电线杆
  public async createElectricPole(coordinate: Coordinate) {
    const mapId = this.adapter!.mapController.dataManager.currentMapId;
    const type = this.creatingDeviceKey;
    const currentPresetId = this.currentPresetId.value;
    if (!currentPresetId) {
      alert.info({
        content: i18n.t('error:electric_pole.no_preset_selected', {
          defaultValue: '未选择电线杆预设，无法创建电线杆，请先创建或选择预设。',
        }),
      });
      return;
    }
    try {
      // 创建前确保该类型可见
      await this.updateItemVisibility(mapId, this.creatingDeviceKey, true);
      const data = this.adapter!.electricPoleController.createElectricPoleData(mapId, coordinate, type);
      if (data) {
        await userService.data.electricPolePresetDataService.createNode(mapId, currentPresetId, data);
      }
    } catch (error) {
      const errorMsg = getElectricPoleErrorMessage(error);
      alert.info({
        content: i18n.t('error:electric_pole.create_failed', {
          defaultValue: '创建失败：{{message}}',
          message: errorMsg,
        }),
      });
    }
  }
  // endregion

  // region: 模式设置
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
  // endregion

  // region: 电线杆创建
  /** 切换是否自动连接 */
  @action
  public toggleAutoConnect() {
    this.autoConnect = !this.autoConnect;
  }

  /** 设置创建类型 */
  @action
  public setCreatingDeviceKey(key: ElectricPoleDeviceKey) {
    this.creatingDeviceKey = key;
  }
  // endregion

  // region: 电线杆删除
  @action
  public deleteElectricPole(pole: ElectricPoleDataInstance, force = false) {
    if (!this.isDeleting && !force) return;
    const presetId = this.currentPresetId.value;
    if (!presetId) return;
    userService.data.electricPolePresetDataService.deleteNode(pole.mapId, presetId, pole.id);
  }

  private initElectricPoleClickEvent() {
    this.adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
      if (!this.isDeleting) return;
      const instance = event.instance;
      const isElectricPole = instance.entityInfo?.category === ElectricPoleKey;
      if (!isElectricPole) return;
      this.deleteElectricPole(instance as unknown as ElectricPoleDataInstance);
    });
  }

  // endregion

  // region: 连线删除
  @action
  public deleteConnection(fromInstance: ElectricPoleDataInstance, targetId: number) {
    if (!this.isDeletingConnection) return;

    const presetId = this.currentPresetId.value;
    if (!presetId) return;

    userService.data.electricPolePresetDataService.disconnectPoles(
      fromInstance.mapId,
      presetId,
      fromInstance.id,
      targetId
    );
  }

  private initConnectionClickEvent() {
    if (this.connectionClickEventInitialized) return;
    this.connectionClickEventInitialized = true;

    this.adapter.event.on(MAP_EVENT.CONNECTION_CLICK, (event) => {
      if (!this.isDeletingConnection) return;
      this.deleteConnection(event.instance, event.targetId);
    });
  }
  // endregion

  // region: 电线杆连接
  /** 设置激活feature为正在连接的电线杆 */
  @action
  public setActiveFeatureToConnectingPole() {
    const activeFeature = this.adapter.activeFeatureController?.activeFeature;
    if (!activeFeature || activeFeature.entityInfo?.category !== ElectricPoleKey) {
      this.connectingPole = null;
      this.adapter.activeFeatureController?.clearActiveFeature?.();
      return;
    }
    this.setConnectingPole(activeFeature as unknown as ElectricPoleDataInstance);
  }

  @action
  public setConnectingPole(pole: ElectricPoleDataInstance) {
    this.connectingPole = pole;
    requestAnimationFrame(() => {
      this.adapter.activeFeatureController?.setActiveFeature?.(pole);
    });
  }

  /** 电线杆连接操作 */
  public connectElectricPole(pole: ElectricPoleDataInstance) {
    if (!this.isConnecting) return;
    this.innerConnectElectricPole(pole);
  }

  private innerConnectElectricPole(pole: ElectricPoleDataInstance) {
    if (this.connectingPole) {
      try {
        // 前置检测（使用 core 的验证逻辑，但不实际连接）
        if (this.connectingPole === pole) return;

        if (this.connectingPole.isConnectedTo(pole.id)) {
          throw new ElectricPoleError('already_connected', this.connectingPole.id);
        }

        // 验证连接类型
        const fromDeviceKey = this.connectingPole.deviceKey;
        const toDeviceKey = pole.deviceKey;
        if (!isSameElectricPoleConnectionType(fromDeviceKey, toDeviceKey)) {
          throw new ElectricPoleError('different_connection_type', this.connectingPole.id);
        }

        // 验证连接数限制
        const fromLimit = getElectricPoleDeviceConfig(fromDeviceKey).maxConnections;
        if (fromLimit !== false && this.connectingPole.connectionCount >= fromLimit) {
          throw new ElectricPoleError('source_slots_full', this.connectingPole.id);
        }

        const toLimit = getElectricPoleDeviceConfig(toDeviceKey).maxConnections;
        if (toLimit !== false && pole.connectionCount >= toLimit) {
          throw new ElectricPoleError('target_slots_full', pole.id);
        }

        // 验证距离
        const distance = calculateDistance(this.connectingPole.coordinates, pole.coordinates);
        if (distance > this.connectingPole.zoneRadius) {
          throw new ElectricPoleError('distance_too_far', this.connectingPole.id);
        }

        // 验证通过，调用 PresetDataService 的连接方法
        const presetId = this.currentPresetId.value;
        if (!presetId) return;

        userService.data.electricPolePresetDataService.connectPoles(
          this.connectingPole.mapId,
          presetId,
          this.connectingPole.id,
          pole.id
        );

        // 连接成功后，将目标电线杆设置为新的连接起点
        this.setConnectingPole(pole);
      } catch (error) {
        const errorMsg = getElectricPoleErrorMessage(error);
        alert.show({
          content: i18n.t('error:electric_pole.connect_failed_with_switch', {
            defaultValue: `连接失败：${errorMsg}，点击切换将当前连接的电线杆切换为点击的电线杆`,
            message: errorMsg,
          }),
          cancelText: i18n.t('error:electric_pole.switch', { defaultValue: '切换' }),
          onCancel: () => {
            this.setConnectingPole(pole);
          },
        });
      }
    } else {
      this.setConnectingPole(pole);
    }
  }

  // endregion

  // region: 内部工具方法

  /**
   * 将指定预设应用到 adapter 的 ElectricPoleController
   */
  protected applyPresetToAdapter(preset: ElectricPolePreset) {
    try {
      this.adapter.electricPoleController.loadElectricPoleData(preset.data ?? []);
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

      // 如果应用预设失败，使用空数据作为后备方案
      const adapter = this.adapter;
      // 通知用户数据可能已损坏
      alert.info({
        // TODO: i18n
        content: `电线杆预设 "${preset.name}" 数据已损坏，请检查并重新创建预设。`,
        onCancel: () => {
          adapter?.electricPoleController.loadElectricPoleData([]);
        },
        cancelText: '删除损坏预设',
      });
    }
  }
  // endregion
}
