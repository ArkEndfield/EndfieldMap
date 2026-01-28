import type { ElectricPolePreset, ElectricPolePresetExportBundle } from '@eftypes/electric_pole';
import type { ElectricPoleMapData, EndfieldMapAdapter, MapData } from '@endfieldmap/map-core';
import {
  DEFAULT_ELECTRIC_POLE_DEVICE_KEY,
  ELECTRIC_POLE_DEVICE_CONFIGS,
  ElectricPoleDataInstance,
  type ElectricPoleDeviceKey,
  ElectricPoleKey,
  LEGACY_ELECTRIC_POLE_DEVICE_KEY,
  MAP_EVENT,
} from '@endfieldmap/map-core';
import {
  debounce,
  ElectricPoleError,
  LocalStorageDB,
  LocalStorageKey,
  logger,
  StorageKey,
  type StorageManager,
} from '@endfieldmap/tools';
import { action, autorun, computed, observable, reaction, runInAction } from 'mobx';

import { alert } from '@/components/common/alert/alert_api';
import { DEBOUNCE_INTERVAL, EXPORT_TYPE_KEY } from '@/const/data';
import i18n from '@/i18n';
import { BasePresetDataService } from '@/services/data/map/base/base_preset';
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
  ElectricPoleMapData,
  ElectricPolePreset,
  ElectricPolePresetExportBundle
> {
  private adapter: EndfieldMapAdapter;
  private reactionDisposers: Array<() => void> = [];

  protected get storageKey(): string {
    return StorageKey.ELECTRIC_POLE;
  }

  protected get exportTypeKey(): string {
    return EXPORT_TYPE_KEY.ELECTRIC_POLE_PRESET;
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
    this.applyCurrentPresetToAdapter();
    this.initEntityClickEvent();
    this.initElecticPoleClickEvent();
    this.initAutoSaveReaction();

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

    runInAction(() => {
      this.initialized = true;
    });

    // 从存储加载数据后，将当前预设应用到地图
    this.applyCurrentPresetToAdapter();

    // 加载所有可见性数据并导入到 Core 层
    await this.loadAndImportVisibility();

    // 初始化可见性数据订阅
    this.initVisibilitySubscriptions();
  }

  /**
   * 加载所有可见性数据并导入到 Core 层
   */
  private async loadAndImportVisibility() {
    const allVisibilityData = await userService.data.electricPoleVisibilityService.getAllMapVisibilityData();

    this.adapter.electricPoleController.importVisibility(allVisibilityData);
  }

  /**
   * 初始化可见性数据订阅
   */
  private initVisibilitySubscriptions() {
    // 订阅可见性数据变化
    userService.data.electricPoleVisibilityService.addSubscribe((mapId, deviceKey, visible) => {
      this.adapter.electricPoleController.setMapDeviceVisible(mapId, deviceKey as ElectricPoleDeviceKey, visible);
    });
  }

  /**
   * 从当前地图（adapter）中获取电线杆数据（临时数据）
   */
  protected get temporaryData(): ElectricPoleMapData {
    if (!this.initialized) {
      throw new Error('ElectricPoleDataService not initialized');
    }
    return this.adapter.electricPoleController.dataManager.allData;
  }

  private debouncedSave = debounce((data: ElectricPoleMapData) => {
    this.upsertCurrentPresetData(data);
  }, DEBOUNCE_INTERVAL);

  @action
  public clearActiveFeature() {
    this.adapter.activeFeatureController?.clearActiveFeature?.();
    this.connectingPole = null;
    this.isConnecting = false;
  }

  // endregion

  // region: 电线杆创建

  /** 开始创建电线杆 */
  @action
  public startCreateElectricPole() {
    this.isCreating = true;
    if (this.autoConnect) this.setActiveFeatureToConnectingPole();
  }

  /**  结束创建电线杆 */
  @action
  public stopCreateElectricPole() {
    this.isCreating = false;
    this.stopConnectElectricPole();
  }

  /** 切换创建状态 */
  @action
  public toggleCreateElectricPole() {
    if (this.isCreating) {
      this.stopCreateElectricPole();
    } else {
      this.startCreateElectricPole();
    }
  }

  /** 设置是否自动连接 */
  @action
  public setAutoConnect(autoConnect: boolean) {
    this.autoConnect = autoConnect;
  }

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

  public get availableDeviceKeys(): ElectricPoleDeviceKey[] {
    return Object.keys(ELECTRIC_POLE_DEVICE_CONFIGS) as ElectricPoleDeviceKey[];
  }

  // region: 可见性（按类型）

  public updateDeviceVisibility(mapId: MapData['id'], deviceKey: ElectricPoleDeviceKey, visible: boolean) {
    // 立即更新 UI
    // this.adapter.electricPoleController.setDeviceVisible(deviceKey, visible);
    // 持久化到数据库
    userService.data.electricPoleVisibilityService.setVisibilityData(mapId, deviceKey, visible);
  }

  // endregion

  private initEntityClickEvent() {
    this.adapter.event.on(MAP_EVENT.MAP_CLICK, (event) => {
      if (!this.isCreating) return;
      const mapId = this.adapter!.mapController.dataManager.currentMapId;
      const coordinate = event.coordinate;
      try {
        // 创建前确保该类型可见
        this.updateDeviceVisibility(mapId, this.creatingDeviceKey, true);

        const feature = this.adapter!.electricPoleController.createElectricPole(
          mapId,
          coordinate,
          this.creatingDeviceKey
        );
        if (feature && this.autoConnect) {
          if (this.connectingPole) {
            try {
              this.connectToPole(feature);
            } catch (error) {
              const errorMsg = getElectricPoleErrorMessage(error);
              alert.show({
                content: i18n.t('error:electric_pole.connect_failed', {
                  defaultValue: '连接失败：{{message}}',
                  message: errorMsg,
                }),
                cancelText: i18n.t('error:electric_pole.delete_pole', { defaultValue: '删除电线杆' }),
                onCancel: () => {
                  this.deleteElectricPole(feature, true);
                },
                onConfirm: () => {
                  this.setConnectingPole(feature);
                },
              });
            }
          } else {
            this.setConnectingPole(feature);
          }
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
    });
  }

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

  // region: 电线杆删除

  @action
  public startDeleteElectricPole() {
    this.isDeleting = true;
    this.clearActiveFeature();
  }

  @action
  public stopDeleteElectricPole() {
    this.isDeleting = false;
  }

  @action
  public toggleDeleteElectricPole() {
    if (this.isDeleting) {
      this.stopDeleteElectricPole();
    } else {
      this.startDeleteElectricPole();
    }
  }

  @action
  public deleteElectricPole(pole: ElectricPoleDataInstance, force = false) {
    if (!this.isDeleting && !force) return;
    const mapId = this.adapter.mapController.dataManager.currentMapId;
    this.adapter.electricPoleController.deleteElectricPole(mapId, pole.id);
    this.adapter.hoverFeatureController.clearHoverFeature();
  }

  private initElecticPoleClickEvent() {
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
  public startDeleteConnection() {
    this.isDeletingConnection = true;
    this.initConnectionClickEvent();
    this.clearActiveFeature();
  }

  @action
  public stopDeleteConnection() {
    this.isDeletingConnection = false;
  }

  @action
  public toggleDeleteConnnection() {
    if (this.isDeletingConnection) {
      this.stopDeleteConnection();
    } else {
      this.startDeleteConnection();
    }
  }

  @action
  public deleteConnection(fromInstance: ElectricPoleDataInstance, targetId: number) {
    if (!this.isDeletingConnection) return;
    fromInstance.disconnectOutgoingTo(targetId);
    this.adapter.hoverConnectionController.clearHoverConnection();
  }

  private initConnectionClickEvent() {
    if (this.connectionClickEventInitialized) return;
    this.connectionClickEventInitialized = true;

    this.adapter.event.on(MAP_EVENT.CONNECTION_CLICK, (event) => {
      if (!this.isDeletingConnection) return;
      this.deleteConnection(event.instance, event.targetId);
    });
  }

  /**
   * 使用 MobX reaction 监听电线杆数据变化并自动保存
   */
  private initAutoSaveReaction() {
    const dispose = autorun(() => {
      const data = this.adapter.electricPoleController.dataManager.allData;
      this.debouncedSave(data);
    });
    this.reactionDisposers.push(dispose);
  }

  // endregion

  // region: 电线杆连接

  @action
  public connectToPole(pole: ElectricPoleDataInstance) {
    if (this.connectingPole) {
      // 前置检测
      if (this.connectingPole === pole) return;

      if (this.connectingPole.isConnectedTo(pole.id)) {
        throw new ElectricPoleError('already_connected', this.connectingPole.id);
      }

      // 以当前起点发出连线为准（距离限制取决于发出方）
      this.connectingPole.connectTo(pole);

      // 连接成功后，将目标电线杆设置为新的连接起点
      this.setConnectingPole(pole);
    }
  }

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

  /** 开始连接电线杆 */
  @action
  public startConnectElectricPole() {
    this.isConnecting = true;
    this.setActiveFeatureToConnectingPole();
  }

  /** 结束连接电线杆 */
  @action
  public stopConnectElectricPole() {
    this.isConnecting = false;
    this.connectingPole = null;
  }

  /** 切换连接状态 */
  @action
  public toggleConnectElectricPole() {
    if (this.isConnecting) {
      this.stopConnectElectricPole();
    } else {
      this.startConnectElectricPole();
    }
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
    if (this.connectingPole) {
      try {
        this.connectToPole(pole);
      } catch (error) {
        const errorMsg = getElectricPoleErrorMessage(error);
        alert.show({
          content: i18n.t('error:electric_pole.connect_failed_with_switch', {
            defaultValue: '连接失败：{{message}}，点击切换将当前连接的电线杆切换为点击的电线杆',
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

  // TODO: 更新需要补充
  @computed
  public get isInElectricOperateMode() {
    return this.isCreating || this.isConnecting || this.isDeleting || this.isDeletingConnection;
  }

  // TODO: 更新需要补充
  @action
  public stopAllOperation() {
    this.stopConnectElectricPole();
    this.stopCreateElectricPole();
    this.stopDeleteElectricPole();
    this.stopDeleteConnection();
  }

  // region: 导入导出预设 - 已移至 BasePresetDataService
  // endregion   */

  // endreigon

  // region: 内部工具方法

  /**
   * 保证 ElectricPoleMapData 中包含所有已知地图索引
   * 并验证每个电线杆数据的有效性
   * 注意：此方法返回新对象，不会修改输入参数
   */
  protected ensureMapData(data: Partial<ElectricPoleMapData> | unknown): ElectricPoleMapData {
    if (!data || typeof data !== 'object') {
      data = {};
    }
    const sourceData = data as Partial<ElectricPoleMapData>;
    const ensured: ElectricPoleMapData = {};

    const mapIds = this.adapter.mapController.dataManager.mapIds;
    for (const map of mapIds) {
      if (!sourceData[map]) {
        ensured[map] = [];
        continue;
      }
      const sourceList = sourceData[map];
      if (!Array.isArray(sourceList)) {
        ensured[map] = [];
        continue;
      }

      const originalCount = sourceList.length;
      // 验证并转换电线杆数据（返回新对象，不修改原数据）
      const validPoles = sourceList
        .filter((pole) => {
          // 检查是否有有效的坐标数据
          if (!pole || typeof pole !== 'object') {
            logger.warn('[ElectricPoleDataService|ensureMapData] Invalid pole data (not an object)', { map, pole });
            return false;
          }

          // 检查坐标是否存在且有效
          if (!pole.position || typeof pole.position !== 'object') {
            logger.warn('[ElectricPoleDataService|ensureMapData] Missing or invalid position', { map, pole });
            return false;
          }

          // 检查 x 和 y 属性是否存在且为数字
          if (typeof pole.position.x !== 'number' || typeof pole.position.y !== 'number') {
            logger.warn('[ElectricPoleDataService|ensureMapData] Invalid position x/y values', {
              map,
              poleId: pole.levelLogicId,
              position: pole.position,
            });
            return false;
          }

          // 检查 x 和 y 是否为有效数字（非 NaN, 非 Infinity）
          if (!Number.isFinite(pole.position.x) || !Number.isFinite(pole.position.y)) {
            logger.warn('[ElectricPoleDataService|ensureMapData] Position contains NaN or Infinity', {
              map,
              poleId: pole.levelLogicId,
              position: pole.position,
            });
            return false;
          }

          return true;
        })
        .map((pole) => {
          // 兼容旧数据：补齐 deviceKey / connections（返回新对象）
          const rawDeviceKey = pole.properties.deviceKey;
          const deviceKey: ElectricPoleDeviceKey =
            typeof rawDeviceKey === 'string' && rawDeviceKey in ELECTRIC_POLE_DEVICE_CONFIGS
              ? (rawDeviceKey as ElectricPoleDeviceKey)
              : LEGACY_ELECTRIC_POLE_DEVICE_KEY;

          const connectionsRaw = Array.isArray(pole.properties.connections) ? pole.properties.connections : [];
          const merged = [...connectionsRaw].filter(
            (id): id is number => typeof id === 'number' && Number.isFinite(id)
          );
          const uniqueConnections = [...new Set<number>(merged)];

          return {
            ...pole,
            properties: {
              ...pole.properties,
              deviceKey,
              connections: uniqueConnections,
            },
          };
        });

      // 如果过滤掉了一些无效数据，记录警告
      const filteredCount = originalCount - validPoles.length;
      if (filteredCount > 0) {
        logger.warn(
          `[ElectricPoleDataService|ensureMapData] Filtered out ${filteredCount} invalid electric pole(s) from ${map}`
        );
      }

      ensured[map] = validPoles;
    }

    return ensured;
  }

  /**
   * 将当前预设应用到 adapter 的 ElectricPoleController
   */

  /**
   * 将指定预设应用到 adapter 的 ElectricPoleController
   */
  protected applyPresetToAdapter(preset: ElectricPolePreset) {
    try {
      const data = this.ensureMapData(preset.data);
      this.adapter.electricPoleController.resetAllElectricPoleData(data);
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
          const emptyData = this.ensureMapData({} as ElectricPoleMapData);
          adapter?.electricPoleController.resetAllElectricPoleData(emptyData);
        },
        cancelText: '删除损坏预设',
      });
    }
  }

  // endregion
}
