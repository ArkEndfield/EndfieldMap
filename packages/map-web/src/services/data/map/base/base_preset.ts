import { logger, StorageManager } from '@endfieldmap/tools';
import { computed, observable, runInAction, toJS } from 'mobx';

import { alert } from '@/components/common/alert/alert_api';

export interface BasePreset<T> {
  id: string;
  name: string;
  data: T;
  createdAt: number;
  updatedAt: number;
}

export interface BasePresetStorage<TPreset> {
  presets: TPreset[];
  currentPresetId: string | null;
}

export interface BasePresetExportBundle<TPreset> {
  type: string;
  version: string;
  exportedAt: number;
  presets: TPreset[];
}

/**
 * 基础预设数据管理器
 * TData: 地图数据类型 (e.g. ElectricPoleMapData, CustomPointMapData)
 * TPreset: 预设对象类型 (e.g. ElectricPolePreset, CustomPointPreset)
 * TBundle: 导出包类型 (e.g. ElectricPolePresetExportBundle, CustomPointPresetExportBundle)
 */
export abstract class BasePresetDataService<
  TData,
  TPreset extends BasePreset<TData>,
  TBundle extends BasePresetExportBundle<TPreset>,
> {
  protected storage: StorageManager;
  protected initialized: boolean = false;

  @observable accessor dataVersion: string = '0.0.1';

  @observable accessor presetStorage: BasePresetStorage<TPreset> = {
    presets: [],
    currentPresetId: null,
  };

  /**
   * 需要子类实现的抽象属性和方法
   */
  // 对应的 StorageKey
  protected abstract get storageKey(): string;
  // 对应的导出类型key
  protected abstract get exportTypeKey(): string;

  // 确保数据格式正确
  protected abstract ensureMapData(data: Partial<TData> | unknown): TData;
  // 应用预设到 adapter
  protected abstract applyPresetToAdapter(preset: TPreset): void;
  // 获取当前的临时数据（用于保存到预设）
  protected abstract get temporaryData(): TData;
  // 清除当前的 Active Feature (切换预设时调用)
  protected abstract clearActiveFeature(): void;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  @computed
  public get currentPreset(): TPreset | null {
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

  @computed
  public get currentPresetData(): TData | null {
    const preset = this.currentPreset;
    return preset ? preset.data : null;
  }

  /**
   * 从 Storage 初始化预设
   */
  public async initPresetFromStorage() {
    if (this.initialized) return;

    const stored = await this.storage.permanentGet<BasePresetStorage<TPreset>>(this.storageKey);

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
        this.presetStorage = {
          presets: [],
          currentPresetId: null,
        };
      }
      this.initialized = true;
    });
  }

  /**
   * 创建新的预设
   */
  public async createPreset(name: string, initialData?: TData | boolean) {
    const now = Date.now();
    const useInitialData = !!initialData && initialData !== true;
    const useCurrentData = initialData === true;

    // 如果 initialData 是数据对象，则使用它
    // 如果 initialData 是 true，且已初始化，则使用当前临时数据
    // 否则使用空对象（需要在子类 ensureMapData 中处理空对象的情况，或者这里传一个空对象给 ensureMapData）
    const baseData = useInitialData
      ? (initialData as TData)
      : this.initialized && useCurrentData
        ? this.temporaryData
        : ({} as TData);

    const ensuredData = this.ensureMapData(baseData);

    const newPreset = {
      id: this.generatePresetId(),
      name,
      data: ensuredData,
      createdAt: now,
      updatedAt: now,
    } as TPreset;

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
   */
  public async switchPreset(id: string) {
    if (this.presetStorage.currentPresetId === id) return;
    this.clearActiveFeature();

    // 在切换预设之前，尝试保存当前数据到当前预设（如果存在）
    if (this.initialized && this.currentPreset) {
      try {
        const currentData = this.temporaryData;
        const ensured = this.ensureMapData(currentData);
        runInAction(() => {
          if (this.currentPreset) {
            this.currentPreset.data = ensured;
            this.currentPreset.updatedAt = Date.now();
          }
        });
        // 不等待保存完成，直接继续
        this.savePresetStorage();
      } catch (error) {
        logger.error('[BasePresetDataService|switchPreset] Failed to save current data:', error);
      }
    }

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
   */
  public async deletePreset(id: string) {
    const index = this.presetStorage.presets.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Preset not found: ${id}`);
    }

    const isCurrent = this.presetStorage.currentPresetId === id;
    let nextPreset: TPreset | null = null;

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

    if (isCurrent) {
      if (nextPreset) {
        this.applyPresetToAdapter(toJS(nextPreset));
      } else {
        // 如果没有预设了，应用空数据
        const emptyData = this.ensureMapData({});
        // 这一步无法直接调用 adapter 方法，需要子类去清理地图
        // 但我们可以创建一个空的 dummy preset 传给 applyPresetToAdapter
        // 或者抛出一个 protected 方法让子类处理 "无预设" 的情况
        // 这里为了简单，我们构造一个临时的空 Preset 对象
        const emptyPreset = {
          id: 'empty',
          name: 'empty',
          data: emptyData,
          createdAt: 0,
          updatedAt: 0,
        } as TPreset;
        try {
          this.applyPresetToAdapter(emptyPreset);
        } catch (e) {
          logger.warn('[BasePresetDataService] Failed to apply empty preset', e);
        }
      }
    }
  }

  /**
   * 重命名预设
   */
  public async renamePreset(id: string, name: string) {
    const preset = this.presetStorage.presets.find((p) => p.id === id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === preset.name) return;

    runInAction(() => {
      preset.name = trimmedName;
      preset.updatedAt = Date.now();
    });

    await this.savePresetStorage();
  }

  public async renameCurrentPreset(name: string) {
    if (!this.currentPresetId) return;
    await this.renamePreset(this.currentPresetId, name);
  }

  public async deleteCurrentPreset() {
    if (!this.currentPresetId) return;
    await this.deletePreset(this.currentPresetId);
  }

  /**
   * 应用当前预设到适配器
   */
  protected applyCurrentPresetToAdapter() {
    if (!this.initialized) return;
    const preset = this.currentPreset;
    if (!preset) return;
    this.applyPresetToAdapter(toJS(preset));
  }

  /**
   * 保存预设存储结构到存储
   */
  protected async savePresetStorage() {
    const plain = {
      presets: toJS(this.presetStorage.presets),
      currentPresetId: toJS(this.presetStorage.currentPresetId),
    };
    await this.storage.permanentSet(this.storageKey, plain);
  }

  /**
   * 自动保存逻辑 (debounce)
   * 子类应该调用这个方法来触发自动保存
   */
  protected upsertCurrentPresetData(data: TData) {
    if (!this.initialized) return;

    const ensuredData = this.ensureMapData(data);

    runInAction(() => {
      if (!this.currentPreset) {
        const now = Date.now();
        const newPreset = {
          id: this.generatePresetId(),
          name: 'Default Preset',
          data: ensuredData,
          createdAt: now,
          updatedAt: now,
        } as TPreset;
        this.presetStorage.presets.push(newPreset);
        this.presetStorage.currentPresetId = newPreset.id;
      } else {
        this.currentPreset.data = ensuredData;
        this.currentPreset.updatedAt = Date.now();
      }
    });

    this.savePresetStorage();
  }

  protected generatePresetId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // region: 导入导出

  public async exportPresets(ids: string[]) {
    if (!ids.length) {
      throw new Error('No presets selected to export');
    }

    const idSet = new Set(ids);
    const presets = this.presetStorage.presets.filter((p) => idSet.has(p.id));

    if (!presets.length) {
      throw new Error('Selected presets not found');
    }

    await this.downloadPresetBundle(presets);
  }

  public async exportPreset(id: string) {
    await this.exportPresets([id]);
  }

  public async exportCurrentPreset() {
    if (!this.currentPresetId) {
      throw new Error('No current preset to export');
    }
    await this.exportPresets([this.currentPresetId]);
  }

  protected async downloadPresetBundle(presets: TPreset[]) {
    const bundle = {
      type: this.exportTypeKey,
      version: this.dataVersion,
      exportedAt: Date.now(),
      presets: presets.map((p) => ({
        ...toJS(p),
        data: this.ensureMapData(p.data),
      })),
    } as TBundle;

    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    let filename: string;
    if (presets.length === 1) {
      const preset = presets[0];
      filename = `${this.exportTypeKey}_${preset.name || preset.id}.json`;
    } else {
      filename = `${this.exportTypeKey}_presets_${presets.length}_${Date.now()}.json`;
    }

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
        // 如果用户取消了保存，直接返回，不再执行后续降级逻辑
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        logger.warn(
          '[BasePresetDataService|downloadPresetBundle] File System Access API failed, falling back to <a> tag download',
          error
        );
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public async importPresetBundle(bundle: TBundle) {
    if (!bundle || bundle.type !== this.exportTypeKey || !Array.isArray(bundle.presets)) {
      throw new Error('Invalid preset bundle format');
    }

    if (bundle.version !== this.dataVersion) {
      logger.warn('[BasePresetDataService|importPresetBundle] Importing preset bundle version mismatch', {
        expected: this.dataVersion,
        actual: bundle.version,
      });
    }

    const now = Date.now();
    const newPresets = bundle.presets.map((preset) => ({
      ...preset,
      id: this.generatePresetId(),
      data: this.ensureMapData(preset.data),
      createdAt: preset.createdAt || now,
      updatedAt: preset.updatedAt || now,
    })) as TPreset[];

    runInAction(() => {
      this.presetStorage.presets.push(...newPresets);
    });

    await this.savePresetStorage();
  }
  // endregion
}
