import { alert } from '@/components/common/endfield_components/alert_api';
import { THROTTLE_INTERVAL } from '@/const/data';
import type {
  ElectricPolePresetStorage,
  ElectricPolePreset,
  ElectricPolePresetExportBundle,
} from '@eftypes/electric_pole';
import type { ElectricPoleMapData, EndfieldMapAdapter } from '@endfieldmap/map-core';
import { ElectricPoleIdKey, MAP_EVENT } from '@endfieldmap/map-core';
import type { ElectricPoleFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_feature';
import { MapIndex, StorageKey, throttle, type StorageManager } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

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

  constructor(storage: StorageManager) {
    this.storage = storage;
    // 使用 MobX 使预设相关状态变为可观察，从而驱动 React observer 组件实时更新
    // makeAutoObservable(this);
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

  /**
   * 对保存操作进行节流（用于连续的编辑操作）
   */
  get saveCurrentAdapterDataToStorageThrottled() {
    return throttle(this.saveCurrentAdapterDataToStorage.bind(this), THROTTLE_INTERVAL);
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

  private initEntityClickEvent() {
    if (this.adapter) {
      this.adapter.event.on(MAP_EVENT.MAP_CLICK, (event) => {
        if (!this.isCreating) return;
        const mapIndex = this.adapter!.currentMapIndex;
        const coordinate = event.coordinate;
        const feature = this.adapter!.electricPoleController.createElectricPoleEntity(mapIndex, coordinate);
        if (feature && this.autoConnect) {
          if (this.connectingPole) {
            try {
              this.connectingPole.connectTo(feature);
              this.setConnectingPole(feature);
            } catch (error) {
              alert.show({
                // TODO: i18n
                content: `连接失败：${error instanceof Error ? error.message : String(error)}`,
                cancelText: '删除电线杆',
                onCancel: () => {
                  if (this.adapter) {
                    const mapIndex = this.adapter.currentMapIndex;
                    this.adapter.electricPoleController.deleteElectricPoleEntity(mapIndex, feature.id);
                  }
                },
                onConfirm: () => {
                  this.setConnectingPole(feature);
                }
              })
            }
          } else {
            this.setConnectingPole(feature);
          }
        }
      })
    }
  }

  // endregion

  // region: 电线杆连接

  /** 设置激活feature为正在连接的电线杆 */
  @action
  public setActiveFeatureToConnectingPole() {
    const activeFeature = this.adapter?.activeFeatureController?.activeFeature;
    if (!activeFeature || activeFeature.entityInfo.entityInfo.point !== ElectricPoleIdKey) return;
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
    this.adapter?.activeFeatureController?.clearActiveFeature?.();
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
    requestAnimationFrame(()=> {
      this.adapter?.activeFeatureController?.setActiveFeature?.(pole);
    })
  }

  /** 电线杆连接操作 */
  public connectElectricPole(pole: ElectricPoleFeature) {
    if (!this.isConnecting) return;
    if (this.connectingPole) {
      try {
        this.connectingPole.connectTo(pole);
        this.setConnectingPole(pole);
      } catch (error) {
        alert.show({
          content: `连接失败：${error instanceof Error ? error.message : String(error)}，点击切换将当前连接的电线杆切换为点击的电线杆`,
          cancelText: '切换',
          onCancel: () => {
            this.setConnectingPole(pole);
          },
        })
      }
    } else {
      this.setConnectingPole(pole);
    }
  }

  // endregion

  @computed
  public get isInElectricOperateMode() {
    return this.isCreating || this.isConnecting;
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
    const baseData =
      useInitialData ? initialData : 
      (this.adapter && this.initialized ? this.adapter.electricPoleController.allData : ({} as ElectricPoleMapData));
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
      this.applyPresetToAdapter(preset);
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
      } else if (!this.presetStorage.presets.length) {
        this.presetStorage.currentPresetId = null;
      }
    });

    await this.savePresetStorage();

    // 仅当删除的是当前预设时，才更新地图上的电线杆数据
    if (this.adapter && isCurrent) {
      if (nextPreset) {
        this.applyPresetToAdapter(nextPreset);
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
  public exportPreset(presetId: string) {
    this.exportPresets([presetId]);
  }

  /**
   * 导出当前预设为 JSON 文件
   */
  public exportCurrentPreset() {
    if (!this.currentPreset) {
      throw new Error('No current electric pole preset to export');
    }
    this.exportPresets([this.currentPreset.id]);
  }

  /**
   * 导出多个预设为单个 JSON 文件
   * @param presetIds 预设 ID 列表
   */
  public exportPresets(presetIds: string[]) {
    if (!presetIds.length) {
      throw new Error('No electric pole presets selected to export');
    }

    const idSet = new Set(presetIds);
    const presets = this.presetStorage.presets.filter((p) => idSet.has(p.id));

    if (!presets.length) {
      throw new Error('Selected electric pole presets not found');
    }

    this.downloadPresetBundle(presets);
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
   */
  private ensureMapData(data: ElectricPoleMapData): ElectricPoleMapData {
    const ensured: ElectricPoleMapData = { ...(data || ({} as ElectricPoleMapData)) };

    // TODO: 需要根据实际地图数量动态获取
    const maps = [MapIndex.MAP01, MapIndex.MAP02];
    for (const map of maps) {
      if (!ensured[map]) {
        ensured[map] = [];
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
    this.applyPresetToAdapter(preset);
  }

  /**
   * 将指定预设应用到 adapter 的 ElectricPoleController
   */
  private applyPresetToAdapter(preset: ElectricPolePreset) {
    if (!this.adapter) return;
    const data = this.ensureMapData(preset.data);
    this.adapter.electricPoleController.resetAllElectricPoleData(data);
    // 重新渲染当前地图上的电线杆
    this.adapter.renderElectricPole(this.adapter.currentMapIndex);
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
    // 通过 JSON 深拷贝将 MobX 可观察对象转换为普通对象，避免 IndexedDB DataCloneError
    const plain: ElectricPolePresetStorage = JSON.parse(
      JSON.stringify({
        presets: this.presetStorage.presets,
        currentPresetId: this.presetStorage.currentPresetId,
      })
    );
    await this.storage.permanentSet(StorageKey.ELECTRIC_POLE, plain);
  }

  /**
   * 根据 storage / adapter 状态更新 initialized 标记
   */
  private updateInitializedFlag() {
    this.initialized = this.storageInitialized && this.adapterRegistered;
  }

  /**
   * 在浏览器中触发下载 JSON 文件（支持导出多个预设）
   */
  private downloadPresetBundle(presets: ElectricPolePreset[]) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // 非浏览器环境下直接返回 JSON 字符串
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
      console.log('ElectricPole preset bundle JSON:', JSON.stringify(bundle, null, 2));
      return;
    }

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
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    // 若只有一个预设，则沿用单预设的命名；否则使用 bundle 命名
    if (presets.length === 1) {
      const preset = presets[0];
      a.download = `electric_pole_${preset.name || preset.id}.json`;
    } else {
      a.download = `electric_pole_presets_${presets.length}_${Date.now()}.json`;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  // endregion
}
