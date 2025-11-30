import type {
  ElectricPolePreset,
  ElectricPolePresetExportBundle,
  ElectricPolePresetStorage,
} from '@eftypes/electric_pole';
import type { ElectricPoleConnectionFeature, ElectricPoleMapData, EndfieldMapAdapter } from '@endfieldmap/map-core';
import { ElectricPoleKey, MAP_EVENT } from '@endfieldmap/map-core';
import type { ElectricPoleFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_feature';
import {
  debounce,
  LocalStorageDB,
  LocalStorageKey,
  logger,
  MapIndex,
  StorageKey,
  type StorageManager,
} from '@endfieldmap/tools';
import { action, computed, observable, runInAction, toJS } from 'mobx';

import { alert } from '@/components/common/endfield_components/alert/alert_api';
import { DEBOUNCE_INTERVAL } from '@/const/data';

/**
 * 电线杆数据管理器
 */
export class ElectricPoleDataService {
  private adapter?: EndfieldMapAdapter;
  private storage: StorageManager;

  /** 是否已经从 Storage 中加载了预设数据 */
  private storageInitialized: boolean = false;

  /** 是否已经注册了 adapter */
  private adapterRegistered: boolean = false;

  /** 预设存储结构 */
  @observable accessor presetStorage: ElectricPolePresetStorage = {
    presets: [],
    currentPresetId: null,
  };

  /** 服务是否完全就绪（已加载存储 + 已注册 adapter） */
  private initialized: boolean = false;

  /** 是否处于创建电线杆状态 */
  @observable accessor isCreating: boolean = false;
  /** 是否自动连接连续创建的电线杆 */
  @observable accessor autoConnect: boolean = true;

  /** 是否处于连接电线杆状态 */
  @observable accessor isConnecting: boolean = false;
  private connectingPole: ElectricPoleFeature | null = null;

  /** 是否处于删除电线杆状态 */
  @observable accessor isDeleting: boolean = false;

  /** 是否处于删除连线状态 */
  @observable accessor isDeletingConnection: boolean = false;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  /**
   * 注册地图适配器
   */
  public registerAdapter(adapter: EndfieldMapAdapter) {
    // 先设置状态为已注册并更新 initialized，再应用预设
    runInAction(() => {
      this.adapter = adapter;
      this.adapterRegistered = true;
      this.updateInitializedFlag();
    });
    // 当 adapter 注册后，如果已经有预设数据，则应用当前预设到地图
    this.applyCurrentPresetToAdapter();
    this.initEntityClickEvent();
    this.initElecticPoleClickEvent();
    this.initElectricPoleChangeEvent();
  }

  // region: 数据处理和获取

  /**
   * 从 Storage 中初始化电线杆预设数据
   * - 仅使用 ElectricPolePresetStorage 结构，不再兼容旧的 ElectricPoleMapData 结构
   */
  public async initFromStorage() {
    if (this.storageInitialized) return;

    const stored = await this.storage.permanentGet<ElectricPolePresetStorage>(StorageKey.ELECTRIC_POLE);

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

  /**
   * 当前是否已经完全初始化完毕
   */
  public get isInitialized() {
    return this.initialized;
  }

  /** 当前预设列表（只暴露只读信息）*/
  @computed
  public get presetList(): Array<Pick<ElectricPolePreset, 'id' | 'name'>> {
    return this.presetStorage.presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
    }));
  }

  /** 当前预设 ID */
  @computed
  public get currentPresetId(): string | null {
    return this.presetStorage.currentPresetId;
  }

  /** 当前预设完整对象 */
  @computed
  public get currentPreset(): ElectricPolePreset | null {
    if (!this.presetStorage.currentPresetId) return null;
    return this.presetStorage.presets.find((p) => p.id === this.presetStorage.currentPresetId) ?? null;
  }

  /** 当前预设的电线杆数据 */
  @computed
  public get currentPresetData(): ElectricPoleMapData | null {
    const preset = this.currentPreset;
    return preset ? preset.data : null;
  }

  /**
   * 从当前地图（adapter）中获取电线杆数据（临时数据）
   */
  get temporaryData(): ElectricPoleMapData {
    if (!this.initialized) {
      throw new Error('ElectricPoleDataService not initialized');
    }
    if (!this.adapter) {
      throw new Error('ElectricPoleDataService not registered adapter');
    }
    return this.adapter.electricPoleController.allData;
  }

  /**
   * 将给定数据保存到当前预设中，并写入 Storage
   */
  public async saveDataToStorage(data: ElectricPoleMapData) {
    if (!this.initialized) {
      throw new Error('ElectricPoleDataService not initialized');
    }
    if (!this.adapter) {
      throw new Error('ElectricPoleDataService not registered adapter');
    }

    const ensuredData = this.ensureMapData(data);

    runInAction(() => {
      // 如果还没有任何预设，自动创建一个默认预设
      if (!this.currentPreset) {
        const now = Date.now();
        const newPreset: ElectricPolePreset = {
          id: this.generatePresetId(),
          name: '默认预设',
          data: ensuredData,
          createdAt: now,
          updatedAt: now,
        };
        this.presetStorage.presets.push(newPreset);
        this.presetStorage.currentPresetId = newPreset.id;
      } else {
        this.currentPreset!.data = ensuredData;
        this.currentPreset!.updatedAt = Date.now();
      }
    });

    await this.savePresetStorage();
  }

  /**
   * 将当前 adapter 中的电线杆数据保存到当前预设
   */
  public async saveCurrentAdapterDataToStorage() {
    return this.saveDataToStorage(this.temporaryData);
  }

  public clearActiveFeature() {
    this.adapter?.activeFeatureController?.clearActiveFeature?.();
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

  private initEntityClickEvent() {
    if (this.adapter) {
      this.adapter.event.on(MAP_EVENT.MAP_CLICK, (event) => {
        if (!this.isCreating) return;
        const mapIndex = this.adapter!.currentMapIndex;
        const coordinate = event.coordinate;
        try {
          const feature = this.adapter!.electricPoleController.createElectricPoleEntity(mapIndex, coordinate);
          if (feature && this.autoConnect) {
            if (this.connectingPole) {
              try {
                this.connectToPole(feature);
              } catch (error) {
                alert.show({
                  // TODO: i18n
                  content: `连接失败：${error instanceof Error ? error.message : String(error)}`,
                  cancelText: '删除电线杆',
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
          alert.info({
            content: `创建失败：${error instanceof Error ? error.message : String(error)}`,
          });
        }
      });
    }
  }

  /**
   * 修改电线杆范围是否可见
   * @param visible
   */
  @action
  public changeZoneVisibility(visible: boolean) {
    this.adapter?.electricPoleController?.setZoneVisible?.(visible);
    LocalStorageDB.set(LocalStorageKey.ELECTRIC_POLE_RANGE_DISPLAY, visible);
  }

  /**
   * 切换电线杆范围可见性
   */
  @action
  public toggleZoneVisibility() {
    const visible = !this.adapter?.electricPoleController?.zoneVisible;
    this.changeZoneVisibility(visible);
  }

  /**
   * 修改电线杆可见性
   */
  @action
  public changeVisibility(visible: boolean) {
    this.adapter?.electricPoleController?.setElectricPoleVisible?.(visible);
    LocalStorageDB.set(LocalStorageKey.ELECTRIC_POLE_DISPLAY, visible);
  }

  /**
   * 切换电线杆可见性
   */
  @action
  public toggleVisibility() {
    const visible = !this.adapter?.electricPoleController?.electricPoleVisible;
    this.changeVisibility(visible);
  }

  // endregion

  // region: 电线杆删除

  @action
  public startDeleteElectricPole() {
    this.isDeleting = true;
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
  public deleteElectricPole(pole: ElectricPoleFeature, force = false) {
    if (!this.isDeleting && !force) return;
    const mapIndex = this.adapter!.currentMapIndex;
    this.adapter?.electricPoleController.deleteElectricPoleEntity(mapIndex, pole.id);
    this.adapter?.mapController.hoverFeatureController.clearHoverFeature();
  }

  private initElecticPoleClickEvent() {
    this.adapter?.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
      if (!this.isDeleting) return;
      const instance = event.instance;
      const isElectricPole = instance.entityInfo.category === ElectricPoleKey;
      if (!isElectricPole) return;
      this.deleteElectricPole(instance as ElectricPoleFeature);
    });
  }

  // endregion

  // region: 连线删除

  @action
  public startDeleteConnection() {
    this.isDeletingConnection = true;
    this.initConnectionClickEvent();
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
  public deleteConnection(connectionFeature: ElectricPoleConnectionFeature) {
    if (!this.isDeletingConnection) return;
    // 获取连接的起始电线杆并清除其连接
    const fromPole = connectionFeature.from as ElectricPoleFeature;
    if (fromPole) {
      fromPole.clearConnectionTo();
    }
    this.adapter?.mapController.hoverConnectionController.clearHoverConnection();
  }

  private initConnectionClickEvent() {
    this.adapter?.event.on(MAP_EVENT.CONNECTION_CLICK, (event) => {
      if (!this.isDeletingConnection) return;
      this.deleteConnection(event.instance);
    });
  }

  private initElectricPoleChangeEvent() {
    this.adapter?.event.on(
      MAP_EVENT.ELECTRIC_POLE_CHANGED,
      debounce(() => {
        // 当电线杆连接关系发生变化时，自动保存数据
        this.saveCurrentAdapterDataToStorage().catch((error) => {
          logger.error('Failed to save electric pole data after connection change:', error);
        });
      }, DEBOUNCE_INTERVAL)
    );
  }

  // endregion

  // region: 电线杆连接

  @action
  public connectToPole(pole: ElectricPoleFeature) {
    if (this.connectingPole) {
      // 前置检测
      if (this.connectingPole === pole) return;

      // 如果两个电线杆已经连接了
      if (
        this.connectingPole.connectionTo === pole ||
        this.connectingPole.connectionFrom === pole ||
        pole.connectionFrom === this.connectingPole ||
        pole.connectionTo === this.connectingPole
      ) {
        throw new Error('两个电线杆已经连接了');
      }

      // 尝试建立连接，如果失败则尝试反向连接或调整连接链
      const connected = this.tryConnect(this.connectingPole, pole);

      if (!connected) {
        throw new Error('无法建立连接：两个电线杆的连接位置都已满');
      }

      // 连接成功后，将目标电线杆设置为新的连接起点
      this.setConnectingPole(pole);
    }
  }

  /**
   * 尝试连接两个电线杆，支持自动调整连接链
   * @param from 起始电线杆
   * @param to 目标电线杆
   * @returns 是否成功建立连接
   */
  private tryConnect(from: ElectricPoleFeature, to: ElectricPoleFeature): boolean {
    // 情况1: from 的 to 位置空闲，直接连接 from->to
    if (!from.connectionTo) {
      from.connectTo(to);
      return true;
    }

    // 情况2: from 的 to 位置已满，但 to 的 to 位置空闲，反向连接 to->from
    if (!to.connectionTo) {
      to.connectTo(from);
      return true;
    }

    // 情况3: 两者的 to 都满了，尝试调整连接链
    // 如果 to 有 from 连接（即 to->C），尝试反转这条连接链
    if (to.connectionTo && !to.connectionFrom) {
      // to->C 存在，尝试递归反转连接链
      const reversed = this.reverseConnectionChain(to);
      if (reversed) {
        // 反转成功后，to 的 to 位置应该空出来了，可以连接 to->from
        to.connectTo(from);
        return true;
      }
    }

    // 情况4: 如果 from 有 from 连接（即 D->from），且 to 的 to 空闲，可以尝试反转 from 的连接链
    if (from.connectionFrom && !from.connectionTo) {
      const reversed = this.reverseConnectionChain(from);
      if (reversed) {
        // 反转成功后，from 的 to 位置应该空出来了，可以连接 from->to
        from.connectTo(to);
        return true;
      }
    }

    return false;
  }

  /**
   * 反转连接链：将 A->B 变成 B->A
   * @param pole 要反转的电线杆（作为连接链的起点）
   * @returns 是否成功反转
   */
  private reverseConnectionChain(pole: ElectricPoleFeature): boolean {
    const next = pole.connectionTo;
    if (!next) return true; // 没有下一个节点，无需反转

    // 如果下一个节点的 to 也满了，需要先递归反转下一个节点的连接链
    if (next.connectionTo) {
      const reversed = this.reverseConnectionChain(next);
      if (!reversed) return false; // 递归反转失败
    }

    // 现在 next 的 to 位置应该是空的，可以反转连接
    // 1. 清除当前连接 pole->next
    pole.clearConnectionTo();

    // 2. 建立反向连接 next->pole
    try {
      next.connectTo(pole);
      return true;
    } catch (error) {
      // 如果距离太远无法连接，恢复原连接
      logger.warn('[ElectricPoleDataService|reverseConnectionChain] Failed to reverse connection', {
        from: pole.id,
        to: next.id,
        error,
      });
      pole.connectTo(next);
      return false;
    }
  }

  /** 设置激活feature为正在连接的电线杆 */
  @action
  public setActiveFeatureToConnectingPole() {
    const activeFeature = this.adapter?.activeFeatureController?.activeFeature;
    if (!activeFeature || activeFeature.entityInfo.category !== ElectricPoleKey) return;
    this.setConnectingPole(activeFeature as ElectricPoleFeature);
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
  public setConnectingPole(pole: ElectricPoleFeature) {
    this.connectingPole = pole;
    requestAnimationFrame(() => {
      this.adapter?.activeFeatureController?.setActiveFeature?.(pole);
    });
  }

  /** 电线杆连接操作 */
  public connectElectricPole(pole: ElectricPoleFeature) {
    if (!this.isConnecting) return;
    if (this.connectingPole) {
      try {
        this.connectToPole(pole);
      } catch (error) {
        alert.show({
          content: `连接失败：${error instanceof Error ? error.message : String(error)}，点击切换将当前连接的电线杆切换为点击的电线杆`,
          cancelText: '切换',
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

  // region: 预设管理
  /**
   * 创建一个新的电线杆预设
   * @param name 预设名称
   * @param initialData 初始数据，为 true 从当前地图数据生成
   */
  public async createPreset(name: string, initialData?: ElectricPoleMapData | boolean) {
    const now = Date.now();
    const useInitialData = !!initialData && initialData !== true;
    const useCurrentData = initialData === true;
    const baseData = useInitialData
      ? initialData
      : this.adapter && this.initialized && useCurrentData
        ? this.adapter.electricPoleController.allData
        : ({} as ElectricPoleMapData);
    const ensuredData = this.ensureMapData(baseData);

    const newPreset: ElectricPolePreset = {
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

    // 若已注册 adapter，则立即应用到地图
    if (this.adapter) {
      this.applyPresetToAdapter(newPreset);
    }
  }

  /**
   * 切换当前预设，并立即应用到地图 + 写入 Storage
   * @param presetId 预设 ID
   */
  public async switchPreset(presetId: string) {
    if (this.presetStorage.currentPresetId === presetId) return;
    this.clearActiveFeature();

    // 在切换预设之前，先将当前地图中的电线杆数据保存到当前预设中
    if (this.initialized && this.adapter && this.currentPreset) {
      try {
        await this.saveCurrentAdapterDataToStorage();
      } catch (error) {
        console.error('Failed to save current electric pole preset before switching:', error);
      }
    }

    const preset = this.presetStorage.presets.find((p) => p.id === presetId);
    if (!preset) {
      throw new Error(`ElectricPole preset not found: ${presetId}`);
    }

    runInAction(() => {
      this.presetStorage.currentPresetId = presetId;
    });
    await this.savePresetStorage();

    if (this.adapter) {
      this.applyPresetToAdapter(toJS(preset));
    }
  }

  /**
   * 重命名指定预设
   * @param presetId 预设 ID
   * @param name 新名称
   */
  public async renamePreset(presetId: string, name: string) {
    const preset = this.presetStorage.presets.find((p) => p.id === presetId);
    if (!preset) {
      throw new Error(`ElectricPole preset not found: ${presetId}`);
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === preset.name) return;

    runInAction(() => {
      preset.name = trimmedName;
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
   * 删除指定预设
   * - 若删除的是当前预设，则自动切换到下一个预设（若存在），否则清空地图上的电线杆
   * @param presetId 预设 ID
   */
  public async deletePreset(presetId: string) {
    const index = this.presetStorage.presets.findIndex((p) => p.id === presetId);
    if (index === -1) {
      throw new Error(`ElectricPole preset not found: ${presetId}`);
    }

    const isCurrent = this.presetStorage.currentPresetId === presetId;
    let nextPreset: ElectricPolePreset | null = null;

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

    // 仅当删除的是当前预设时，才更新地图上的电线杆数据
    if (this.adapter && isCurrent) {
      if (nextPreset) {
        this.applyPresetToAdapter(toJS(nextPreset));
      } else {
        // 若已经没有任何预设，则清空所有地图上的电线杆
        const emptyData = this.ensureMapData({} as ElectricPoleMapData);
        this.adapter.electricPoleController.resetAllElectricPoleData(emptyData);
        this.adapter.renderElectricPole(this.adapter.currentMapIndex);
      }
    }
  }

  /**
   * 删除当前预设（若存在）
   */
  public async deleteCurrentPreset() {
    if (!this.currentPresetId) return;
    await this.deletePreset(this.currentPresetId);
  }

  // endregion

  // region: 导入导出预设
  /**
   * 导出指定预设为 JSON 文件
   * - 新结构：ElectricPolePresetExportBundle，内部包含 presets 数组
   */
  public async exportPreset(presetId: string) {
    await this.exportPresets([presetId]);
  }

  /**
   * 导出当前预设为 JSON 文件
   */
  public async exportCurrentPreset() {
    if (!this.currentPreset) {
      throw new Error('No current electric pole preset to export');
    }
    await this.exportPresets([this.currentPreset.id]);
  }

  /**
   * 导出多个预设为单个 JSON 文件
   * @param presetIds 预设 ID 列表
   */
  public async exportPresets(presetIds: string[]) {
    if (!presetIds.length) {
      throw new Error('No electric pole presets selected to export');
    }

    const idSet = new Set(presetIds);
    const presets = this.presetStorage.presets.filter((p) => idSet.has(p.id));

    if (!presets.length) {
      throw new Error('Selected electric pole presets not found');
    }

    await this.downloadPresetBundle(presets);
  }

  /**
   * 从导出的 JSON bundle 中导入预设
   * - 只追加新预设，不会删除或覆盖现有预设
   * - 若导入的预设 ID 与现有预设重复，则为导入的预设生成新的 ID
   */
  public async importPresetBundle(bundle: ElectricPolePresetExportBundle) {
    if (!bundle || bundle.type !== 'electric_pole_preset_bundle' || !Array.isArray(bundle.presets)) {
      throw new Error('Invalid electric pole preset bundle');
    }

    const now = Date.now();

    runInAction(() => {
      for (const raw of bundle.presets) {
        const ensuredData = this.ensureMapData(raw.data);

        const exists = this.presetStorage.presets.find((p) => p.id === raw.id);
        const id = exists ? this.generatePresetId() : raw.id;

        const preset: ElectricPolePreset = {
          id,
          name: raw.name,
          data: ensuredData,
          createdAt: raw.createdAt ?? now,
          updatedAt: raw.updatedAt ?? now,
        };

        this.presetStorage.presets.push(preset);
      }
    });

    await this.savePresetStorage();
  }

  // endreigon

  // region: 内部工具方法

  /**
   * 保证 ElectricPoleMapData 中包含所有已知地图索引
   * 并验证每个电线杆数据的有效性
   */
  private ensureMapData(data: ElectricPoleMapData): ElectricPoleMapData {
    const ensured: ElectricPoleMapData = { ...(data || ({} as ElectricPoleMapData)) };

    // TODO: 需要根据实际地图数量动态获取
    const maps = [MapIndex.MAP01, MapIndex.MAP02];
    for (const map of maps) {
      if (!ensured[map]) {
        ensured[map] = [];
      } else if (Array.isArray(ensured[map])) {
        // 验证并过滤掉无效的电线杆数据
        const validPoles = ensured[map].filter((pole) => {
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
        });

        // 如果过滤掉了一些无效数据，记录警告
        const filteredCount = ensured[map].length - validPoles.length;
        if (filteredCount > 0) {
          logger.warn(
            `[ElectricPoleDataService|ensureMapData] Filtered out ${filteredCount} invalid electric pole(s) from ${map}`,
            ensured[map],
            validPoles
          );
        }

        ensured[map] = validPoles;
      }
    }

    return ensured;
  }

  /**
   * 将当前预设应用到 adapter 的 ElectricPoleController
   */
  private applyCurrentPresetToAdapter() {
    if (!this.adapter || !this.storageInitialized) return;
    const preset = this.currentPreset;
    if (!preset) return;
    this.applyPresetToAdapter(toJS(preset));
  }

  /**
   * 将指定预设应用到 adapter 的 ElectricPoleController
   */
  private applyPresetToAdapter(preset: ElectricPolePreset) {
    if (!this.adapter) return;

    try {
      const data = this.ensureMapData(preset.data);
      this.adapter.electricPoleController.resetAllElectricPoleData(data);
      // 重新渲染当前地图上的电线杆
      this.adapter.renderElectricPole(this.adapter.currentMapIndex);
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
      // const emptyData = this.ensureMapData({} as ElectricPoleMapData);
      // this.adapter.electricPoleController.resetAllElectricPoleData(emptyData);
      // this.adapter.renderElectricPole(this.adapter.currentMapIndex);
      const adapter = this.adapter;
      // 通知用户数据可能已损坏
      alert.info({
        // TODO: i18n
        content: `电线杆预设 "${preset.name}" 数据已损坏，请检查并重新创建预设。`,
        onCancel: () => {
          const emptyData = this.ensureMapData({} as ElectricPoleMapData);
          adapter?.electricPoleController.resetAllElectricPoleData(emptyData);
          adapter?.renderElectricPole(adapter?.currentMapIndex);
        },
        cancelText: '删除损坏预设',
      });
    }
  }

  /**
   * 生成预设 ID
   */
  private generatePresetId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * 将预设存储写入 Storage
   */
  private async savePresetStorage() {
    const plain = {
      presets: toJS(this.presetStorage.presets),
      currentPresetId: toJS(this.presetStorage.currentPresetId),
    };
    await this.storage.permanentSet(StorageKey.ELECTRIC_POLE, plain);
  }

  /**
   * 根据 storage / adapter 状态更新 initialized 标记
   */
  private updateInitializedFlag() {
    this.initialized = this.storageInitialized && this.adapterRegistered;
  }

  /**
   * 在浏览器中触发下载 JSON 文件(支持导出多个预设)
   * 优先使用 File System Access API，不支持时回退到 <a> 标签下载
   */
  private async downloadPresetBundle(presets: ElectricPolePreset[]) {
    const bundle: ElectricPolePresetExportBundle = {
      type: 'electric_pole_preset_bundle',
      version: 1,
      exportedAt: Date.now(),
      presets: presets.map((p) => ({
        id: p.id,
        name: p.name,
        data: this.ensureMapData(p.data),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };

    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    // 生成文件名
    let filename: string;
    if (presets.length === 1) {
      const preset = presets[0];
      filename = `electric_pole_${preset.name || preset.id}.json`;
    } else {
      filename = `electric_pole_presets_${presets.length}_${Date.now()}.json`;
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
        // TODO: i18n
        alert.info('success');
        return;
      } catch (error) {
        // 用户取消或其他错误，回退到 <a> 标签下载
        if (error instanceof Error && error.name !== 'AbortError') {
          logger.warn(
            '[ElectricPoleDataService|downloadPresetBundle] File System Access API failed, falling back to <a> tag download',
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
  // endregion
}
