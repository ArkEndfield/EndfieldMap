import type { EntityData, MapData } from '@endfieldmap/map-core';
import { downloadData, LocalStorageValue, logger } from '@endfieldmap/tools';
import { observable, runInAction, toJS } from 'mobx';

import { alert } from '@/components/common/alert/alert_api';
import type { PresetSchemaType } from '@/services/data/db/schema/user_data/preset';
import type { VisibilityDataSchemaType } from '@/services/data/db/schema/user_data/visibility';
import { userService } from '@/services/user';
import type { IPresetService, RequiredNodeFields } from '@/services/user/data/preset/_base';
import { service } from '@/services';

export type VisibilityData = VisibilityDataSchemaType;

export interface BasePresetExportBundle<TPreset> {
  type: string;
  version: string;
  exportedAt: number;
  presets: TPreset[];
}

/**
 * 旧版本（0.0.1）的预设导出包格式
 * data 字段是对象格式: { mapId: nodes[] }
 * 使用 unknown[] 因为旧数据可能包含不在当前 schema 中的字段
 */
export interface LegacyPresetExportBundleV001 {
  type: string;
  version: '0.0.1';
  exportedAt: number;
  presets: Array<{
    id: string;
    name: string;
    data: Record<string, unknown[]>;
    createdAt: number;
    updatedAt: number;
  }>;
}

export interface IVisibilityService {
  getAllMapVisibilityData(): Promise<VisibilityDataSchemaType[]>;
  setVisibilityData(mapId: string, entityKey: string, visible: boolean): Promise<VisibilityDataSchemaType>;
  addSubscribe(callback: (mapId: string, entityKey: string, visible: boolean) => void): void;
}

/**
 * 基础预设数据管理器
 * TNodeSchema: 节点 Schema 类型 (e.g. ElectricPoleNodeSchemaType, CustomPointNodeSchemaType) - 从 schema 生成，必须包含 RequiredNodeFields
 * TPreset: 预设对象类型 (e.g. ElectricPolePreset, CustomPointPreset) - 必须包含 PresetSchemaType 字段和 data: TNodeSchema[]
 * TBundle: 导出包类型 (e.g. ElectricPolePresetExportBundle, CustomPointPresetExportBundle)
 * TPresetService: 预设服务类型 (e.g. ElectricPolePresetDataService, CustomPointPresetDataService)
 */
export abstract class BasePresetDataService<
  TNodeSchema extends RequiredNodeFields,
  TPreset extends PresetSchemaType & { data: TNodeSchema[] },
  TBundle extends BasePresetExportBundle<TPreset>,
  TPresetService extends IPresetService<TPreset, TNodeSchema> = IPresetService<TPreset, TNodeSchema>,
> {
  @observable
  accessor dataVersion: string = '0.0.2';

  private _currentPresetId: LocalStorageValue<string | null> | null = null;

  public get currentPresetId(): LocalStorageValue<string | null> {
    if (!this._currentPresetId) {
      this._currentPresetId = new LocalStorageValue<string | null>({
        storageKey: this.currentPresetIdKey,
        initialValue: null,
      });
    }
    return this._currentPresetId;
  }

  /**
   * 需要子类实现的抽象属性和方法
   */
  // 对应的导出类型key
  protected abstract get exportTypeKey(): string;
  // 对应的当前预设id的key
  protected abstract get currentPresetIdKey(): string;

  // 可见性服务
  protected abstract get visibilityService(): IVisibilityService;
  // 预设数据服务 (从数据库读取)
  protected abstract get presetService(): TPresetService;

  // 应用预设到 adapter
  protected abstract applyPresetToAdapter(preset: TPreset): void;
  // 清除当前的 Active Feature (切换预设时调用)
  protected abstract clearActiveFeature(): void;

  // 导入可见性数据到 Adapter
  protected abstract importVisibilityToAdapter(data: VisibilityDataSchemaType[]): void;
  // 处理可见性变更订阅
  protected abstract onVisibilityChange(mapId: string, key: string, visible: boolean): void;

  /**
   * 初始化可见性逻辑 (加载 + 订阅)
   */
  protected async initVisibilityLogic() {
    // 加载所有可见性数据并导入到 Core 层
    const allVisibilityData = await this.visibilityService.getAllMapVisibilityData();
    this.importVisibilityToAdapter(allVisibilityData);

    // 订阅可见性数据变化
    this.visibilityService.addSubscribe((mapId, entityKey, visible) => {
      this.onVisibilityChange(mapId, entityKey, visible);
    });
  }

  /**
   * 更新单项可见性
   */
  public async updateItemVisibility(mapId: string, key: string, visible: boolean) {
    await this.visibilityService.setVisibilityData(mapId, key, visible);
  }

  constructor() {}
  /**
   * 从 Storage 初始化预设
   */
  public async initPresetFromStorage() {
    // 从数据库加载预设列表，只获取元数据
    const presets = await this.presetService.getAllPresetMetadata();

    runInAction(() => {
      if (presets.length > 0) {
        // 验证当前预设 ID 是否有效
        const currentId = this.currentPresetId.value;
        const hasCurrentPreset = currentId && presets.some((p) => p.id === currentId);
        if (!hasCurrentPreset) {
          this.currentPresetId.value = presets[0]?.id ?? null;
        }
      } else {
        this.currentPresetId.value = null;
      }
    });

    // 初始化后应用当前预设到适配器
    await this.applyPresetById(this.currentPresetId.value);
  }

  /**
   * 重置预设服务状态
   * 用于清除所有数据后重置状态（停止操作模式、清除当前预设、清除渲染）
   */
  public reset() {
    runInAction(() => {
      // 1. 停止所有操作模式
      this.clearActiveFeature();

      // 2. 重置当前预设 ID
      this.currentPresetId.value = null;
    });

    // 4. 应用空预设到适配器，清除渲染
    const emptyPreset = {
      id: 'empty',
      name: 'empty',
      data: [] as TNodeSchema[],
      createdAt: 0,
      updatedAt: 0,
    } as TPreset;

    try {
      this.applyPresetToAdapter(emptyPreset);
    } catch (e) {
      logger.warn('[BasePresetDataService] Failed to apply empty preset during reset', e);
    }
  }

  /**
   * 创建新的预设
   */
  public async createPreset(name: string) {
    // 通过数据库服务创建预设
    const newPreset = await this.presetService.createPreset(name, []);

    runInAction(() => {
      this.clearActiveFeature();
      this.currentPresetId.value = newPreset.id;
    });

    this.applyPresetToAdapter(newPreset);
  }

  /**
   * 切换预设
   */
  public async switchPreset(id: string) {
    if (this.currentPresetId.value === id) return;

    // 先检查目标预设是否存在
    const preset = await this.presetService.getPresetById(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    runInAction(() => {
      this.clearActiveFeature();
      this.currentPresetId.value = id;
    });

    await this.applyPresetById(id);
  }

  /**
   * 删除预设
   */
  public async deletePreset(id: string) {
    // 先检查预设是否存在
    const preset = await this.presetService.getPresetById(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    const isCurrent = this.currentPresetId.value === id;

    // 通过数据库服务删除预设
    await this.presetService.deletePreset(id);

    if (isCurrent) {
      // 获取剩余预设列表
      const remainingPresets = await this.presetService.getAllPresetMetadata();
      const nextPresetId = remainingPresets[0]?.id ?? null;

      runInAction(() => {
        this.currentPresetId.value = nextPresetId;
        this.clearActiveFeature();
      });

      if (nextPresetId) {
        await this.applyPresetById(nextPresetId);
      } else {
        // 如果没有预设了，应用空数据
        const emptyPreset = {
          id: 'empty',
          name: 'empty',
          data: [] as TNodeSchema[],
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
    const preset = await this.presetService.getPresetById(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === preset.name) return;

    // 通过数据库服务更新名称
    await this.presetService.updatePreset(id, { name: trimmedName });
  }

  /**
   * 通过 ID 应用预设到适配器
   * 初始化和切换预设时统一调用此方法
   */
  protected async applyPresetById(id: string | null) {
    if (!id) return;
    const preset = await this.presetService.getPresetById(id);
    if (!preset) return;

    runInAction(() => {
      this.applyPresetToAdapter(toJS(preset));
    });
  }

  // region: 节点数据处理
  public async renameNode(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], newName: string) {
    const presetId = this.currentPresetId.value;
    if (!presetId) {
      throw new Error('No active preset to rename node in');
    }
    await this.presetService.renameNode(mapId, presetId, levelLogicId, newName);
  }
  // endregion

  // region: 导入导出
  /**
   * 通过 ID 获取预设
   */
  public async getPresetById(id: string | null): Promise<TPreset | null> {
    if (!id) return null;
    return await this.presetService.getPresetById(id);
  }

  /**
   * 导入预设
   */
  public async importPreset(name: string, data: TNodeSchema[]) {
    await this.presetService.createPreset(name, data);
  }

  public async exportPresets(ids: string[]) {
    if (!ids.length) {
      throw new Error('No presets selected to export');
    }

    // 从数据库读取预设用于导出（已清理 RxDB 私有字段）
    const presets: TPreset[] = [];
    for (const id of ids) {
      const preset = await this.getPresetById(id);
      if (preset) {
        presets.push(preset);
      }
    }

    if (!presets.length) {
      throw new Error('Selected presets not found');
    }

    await this.downloadPresetBundle(presets);
  }

  protected async downloadPresetBundle(presets: TPreset[]) {
    const bundle = {
      type: this.exportTypeKey,
      version: this.dataVersion,
      exportedAt: Date.now(),
      presets: toJS(presets),
    } as TBundle;

    let filename: string;
    if (presets.length === 1) {
      const preset = presets[0];
      filename = `${this.exportTypeKey}_${preset.name || preset.id}.json`;
    } else {
      filename = `${this.exportTypeKey}_presets_${presets.length}_${Date.now()}.json`;
    }

    await downloadData(bundle, filename);
    alert.info('导出成功');
  }

  public async importPresetBundle(bundle: TBundle) {
    if (!bundle || bundle.type !== this.exportTypeKey || !Array.isArray(bundle.presets)) {
      throw new Error('Invalid preset bundle format');
    }

    // 根据版本号调用不同的导入逻辑
    if (bundle.version === '0.0.1') {
      return await this.importPresetBundleVersion001(bundle as unknown as LegacyPresetExportBundleV001);
    }

    if (bundle.version !== this.dataVersion) {
      logger.warn('[BasePresetDataService|importPresetBundle] Importing preset bundle version mismatch', {
        expected: this.dataVersion,
        actual: bundle.version,
      });
    }

    // 通过数据库服务创建每个预设
    for (const preset of bundle.presets) {
      await this.importPreset(preset.name, preset.data ?? []);
    }
  }

  /**
   * 导入旧版本（0.0.1）的预设
   * 旧版本的 data 格式为 { mapId: nodes[] }，需要转换为扁平数组并为每个节点添加 mapId
   */
  protected async importPresetBundleVersion001(bundle: LegacyPresetExportBundleV001) {
    if (!bundle || !Array.isArray(bundle.presets)) {
      throw new Error('Invalid preset bundle format');
    }

    for (const preset of bundle.presets) {
      // 将旧版本的对象格式转换为新版本的数组格式
      const nodes: TNodeSchema[] = [];
      if (preset.data && typeof preset.data === 'object') {
        for (const [mapId, mapNodes] of Object.entries(preset.data)) {
          if (Array.isArray(mapNodes)) {
            for (const node of mapNodes) {
              // 过滤掉旧版本中存在但新 schema 不允许的字段 (如 entityInfo)
              const cleanedNode = this.cleanLegacyNodeData(node, mapId);
              nodes.push(cleanedNode);
            }
          }
        }
      }

      await this.importPreset(preset.name, nodes);
    }
  }

  /**
   * 清理旧版本节点数据，移除不在当前 schema 中的字段
   */
  protected cleanLegacyNodeData(node: unknown, mapId: string): TNodeSchema {
    const nodeData = node as Record<string, unknown>;
    // 只保留 schema 中定义的字段
    const cleaned = {
      levelLogicId: nodeData.levelLogicId,
      entityDataIdKey: nodeData.entityDataIdKey,
      templateId: nodeData.templateId,
      entityType: nodeData.entityType,
      position: nodeData.position,
      properties: nodeData.properties,
      mapId,
    };

    return cleaned as unknown as TNodeSchema;
  }
  // endregion

  // region: 分享处理
  public get canShare() {
    if (!userService.auth.isLogin) {
      alert.info(service.i18nService.translate('not_login', { ns: 'error' }));
      return false;
    }

    return true;
  }

  public async sharePreset(id: string, name: string, description: string, type?: string): Promise<boolean> {
    if (!name.trim()) {
      return false;
    }
    const data = await this.getPresetById(id);
    if (!data) {
      return false;
    }
    await this.sharePresetToServer(data.data, name, description, type);
    return true;
  }

  protected abstract sharePresetToServer(
    data: TNodeSchema[],
    name: string,
    description: string,
    type?: string
  ): Promise<unknown>;
  // endregion
}
