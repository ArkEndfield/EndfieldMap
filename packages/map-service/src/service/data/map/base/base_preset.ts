import type { EntityData, MapData } from '@endfieldmap/map-core';
import type {
  IPresetService,
  IVisibilityService,
  RequiredNodeFields,
} from '@endfieldmap/map-service/@types/preset_base';
import { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import type { PresetSchemaType } from '@endfieldmap/map-service/service/db/export';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import { PresetService } from '@endfieldmap/map-service/service/preset_service';
import { serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { SERVICE_EVENT } from '@endfieldmap/map-service/service/service_emitter';
import { downloadData, LocalStorageValue, logger } from '@endfieldmap/tools';
import { observable, runInAction, toJS } from 'mobx';

export type VisibilityData = { mapId: string; entityKey: string; visible: boolean };

export interface BasePresetExportBundle<TPreset> {
  type: string;
  version: string;
  exportedAt: number;
  presets: TPreset[];
}

/**
 * 旧版本（0.0.1）的预设导出包格式
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

export interface BasePresetDataServiceDeps {
  adapterRegistry: AdapterRegistry;
  i18nService: I18nService;
  isUserLoggedIn: () => boolean;
  presetService?: PresetService;
}

/**
 * 基础预设数据管理器
 */
export abstract class BasePresetDataService<
  TNodeSchema extends RequiredNodeFields,
  TPreset extends PresetSchemaType & { data: TNodeSchema[] },
  TBundle extends BasePresetExportBundle<TPreset>,
  TPresetService extends IPresetService<TPreset, TNodeSchema> = IPresetService<TPreset, TNodeSchema>,
  TDeps extends BasePresetDataServiceDeps = BasePresetDataServiceDeps,
> {
  @observable
  accessor dataVersion: string = '0.0.2';

  private _currentPresetId: LocalStorageValue<string | null> | null = null;

  protected deps: TDeps;

  public get currentPresetId(): LocalStorageValue<string | null> {
    if (!this._currentPresetId) {
      this._currentPresetId = new LocalStorageValue<string | null>({
        storageKey: this.currentPresetIdKey,
        initialValue: null,
      });
    }
    return this._currentPresetId;
  }

  protected abstract get exportTypeKey(): string;
  protected abstract get currentPresetIdKey(): string;
  protected abstract get visibilityService(): IVisibilityService;
  protected abstract get presetDataService(): TPresetService;

  protected abstract applyPresetToAdapter(preset: TPreset): void;
  protected abstract clearActiveFeature(): void;
  protected abstract importVisibilityToAdapter(data: VisibilityData[]): void;
  protected abstract onVisibilityChange(mapId: string, key: string, visible: boolean): void;

  protected async initVisibilityLogic() {
    const allVisibilityData = await this.visibilityService.getAllMapVisibilityData();
    this.importVisibilityToAdapter(allVisibilityData);

    this.visibilityService.addSubscribe((mapId, entityKey, visible) => {
      this.onVisibilityChange(mapId, entityKey, visible);
    });
  }

  public async updateItemVisibility(mapId: string, key: string, visible: boolean) {
    await this.visibilityService.setVisibilityData(mapId, key, visible);
  }

  constructor(deps: TDeps) {
    this.deps = deps;
  }

  public async initPresetFromStorage() {
    const presets = await this.presetDataService.getAllPresetMetadata();

    runInAction(() => {
      if (presets.length > 0) {
        const currentId = this.currentPresetId.value;
        const hasCurrentPreset = currentId && presets.some((p) => p.id === currentId);
        if (!hasCurrentPreset) {
          this.currentPresetId.value = presets[0]?.id ?? null;
        }
      } else {
        this.currentPresetId.value = null;
      }
    });

    await this.applyPresetById(this.currentPresetId.value);
  }

  public reset() {
    runInAction(() => {
      this.clearActiveFeature();
      this.currentPresetId.value = null;
    });

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

  public async createPreset(name: string) {
    const newPreset = await this.presetDataService.createPreset(name, []);

    runInAction(() => {
      this.clearActiveFeature();
      this.currentPresetId.value = newPreset.id;
    });

    this.applyPresetToAdapter(newPreset);
  }

  public async switchPreset(id: string) {
    if (this.currentPresetId.value === id) return;

    const preset = await this.presetDataService.getPresetById(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    runInAction(() => {
      this.clearActiveFeature();
      this.currentPresetId.value = id;
    });

    await this.applyPresetById(id);
  }

  public async deletePreset(id: string) {
    const preset = await this.presetDataService.getPresetById(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    const isCurrent = this.currentPresetId.value === id;

    await this.presetDataService.deletePreset(id);

    if (isCurrent) {
      const remainingPresets = await this.presetDataService.getAllPresetMetadata();
      const nextPresetId = remainingPresets[0]?.id ?? null;

      runInAction(() => {
        this.currentPresetId.value = nextPresetId;
        this.clearActiveFeature();
      });

      if (nextPresetId) {
        await this.applyPresetById(nextPresetId);
      } else {
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

  public async renamePreset(id: string, name: string) {
    const preset = await this.presetDataService.getPresetById(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === preset.name) return;

    await this.presetDataService.updatePreset(id, { name: trimmedName });
  }

  protected async applyPresetById(id: string | null) {
    if (!id) return;
    const preset = await this.presetDataService.getPresetById(id);
    if (!preset) return;

    runInAction(() => {
      this.applyPresetToAdapter(toJS(preset));
    });
  }

  public async renameNode(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], newName: string) {
    const presetId = this.currentPresetId.value;
    if (!presetId) {
      throw new Error('No active preset to rename node in');
    }
    await this.presetDataService.renameNode(mapId, presetId, levelLogicId, newName);
  }

  public async getPresetById(id: string | null): Promise<TPreset | null> {
    if (!id) return null;
    return await this.presetDataService.getPresetById(id);
  }

  public async importPreset(name: string, data: TNodeSchema[]) {
    await this.presetDataService.createPreset(name, data);
  }

  public async exportPresets(ids: string[]) {
    if (!ids.length) {
      throw new Error('No presets selected to export');
    }

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
    serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, '导出成功');
  }

  public async importPresetBundle(bundle: TBundle) {
    if (!bundle || bundle.type !== this.exportTypeKey || !Array.isArray(bundle.presets)) {
      throw new Error('Invalid preset bundle format');
    }

    if (bundle.version === '0.0.1') {
      return await this.importPresetBundleVersion001(bundle as unknown as LegacyPresetExportBundleV001);
    }

    if (bundle.version !== this.dataVersion) {
      logger.warn('[BasePresetDataService|importPresetBundle] Importing preset bundle version mismatch', {
        expected: this.dataVersion,
        actual: bundle.version,
      });
    }

    for (const preset of bundle.presets) {
      await this.importPreset(preset.name, preset.data ?? []);
    }
  }

  protected async importPresetBundleVersion001(bundle: LegacyPresetExportBundleV001) {
    if (!bundle || !Array.isArray(bundle.presets)) {
      throw new Error('Invalid preset bundle format');
    }

    for (const preset of bundle.presets) {
      const nodes: TNodeSchema[] = [];
      if (preset.data && typeof preset.data === 'object') {
        for (const [mapId, mapNodes] of Object.entries(preset.data)) {
          if (Array.isArray(mapNodes)) {
            for (const node of mapNodes) {
              const cleanedNode = this.cleanLegacyNodeData(node, mapId);
              nodes.push(cleanedNode);
            }
          }
        }
      }

      await this.importPreset(preset.name, nodes);
    }
  }

  protected cleanLegacyNodeData(node: unknown, mapId: string): TNodeSchema {
    const nodeData = node as Record<string, unknown>;
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

  public get canShare() {
    if (!this.deps.isUserLoggedIn()) {
      serviceEmitter.fire(
        SERVICE_EVENT.ALERT_INFO,
        this.deps.i18nService.translate('not_login', { ns: 'error' })
      );
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
}
