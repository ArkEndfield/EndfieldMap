import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { addRxPlugin, createRxDatabase, type RxDatabase } from 'rxdb/plugins/core';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { isDev } from '@/services/env';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { electricPoleNodeSchema, type ElectricPoleNodeCollection } from '@/services/data/db/schema/electric_pole';
import { customPointNodeSchema, type CustomPointNodeCollection } from '@/services/data/db/schema/custom_point';
import { markDataSchema, type MarkDataCollection } from '@/services/data/db/schema/mark';
import { visibilityDataSchema, type VisibilityDataCollection } from '@/services/data/db/schema/visibility';
import { presetSchema, type PresetCollection } from '@/services/data/db/schema/preset';
import { DataService } from '@/services/data';
import { StorageKey } from '@endfieldmap/tools';
import type { ElectricPolePreset } from '@/@types/electric_pole';
import type { CustomPointPreset } from '@/@types/custom_point';
import { EntityMarkService } from '@/services/data/user/marked/entity';

export interface BasePresetStorage<TPreset> {
  presets: TPreset[];
  currentPresetId: string | null;
}

export type DBCollections = {
  electricPoleNode: ElectricPoleNodeCollection;
  electricPolePreset: PresetCollection;
  electricPoleVisibility: VisibilityDataCollection;

  customPointNode: CustomPointNodeCollection;
  customPointPreset: PresetCollection;
  customPointVisibility: VisibilityDataCollection;

  entityMark: MarkDataCollection;
  entityVisibility: VisibilityDataCollection;
};

export class Storage {
  public storage = wrappedValidateAjvStorage({ storage: getRxStorageDexie() });
  private db?: RxDatabase<DBCollections>;
  private isInitialized = false;

  constructor() {
    if (isDev) {
      addRxPlugin(RxDBDevModePlugin);
    }
    addRxPlugin(RxDBUpdatePlugin);
  }

  public async init() {
    if (this.isInitialized) {
      return;
    }
    this.db = await createRxDatabase<DBCollections>({
      name: 'endfieldmap',
      storage: this.storage,
    });
    await this.initDBSchema();
    await this.migrate();
    this.isInitialized = true;
  }

  private async initDBSchema() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    await this.db.addCollections({
      electricPoleNode: {
        schema: electricPoleNodeSchema,
      },
      electricPolePreset: {
        schema: presetSchema,
      },
      electricPoleVisibility: {
        schema: visibilityDataSchema,
      },
      customPointNode: {
        schema: customPointNodeSchema,
      },
      customPointPreset: {
        schema: presetSchema,
      },
      customPointVisibility: {
        schema: visibilityDataSchema,
      },
      entityMark: {
        schema: markDataSchema,
      },
      entityVisibility: {
        schema: visibilityDataSchema,
      },
    });
  }

  public get database() {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  private static MIGRATION_KEY = 'endfieldmap:migrated_to_rxdb';

  public async migrate() {
    // 检查是否已迁移
    if (localStorage.getItem(Storage.MIGRATION_KEY)) {
      return;
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const storage = DataService.storage;

    // 并行获取所有旧数据
    const [
      electricPolePresetData,
      electricPoleVisibilityData,
      customPointPresetData,
      customPointVisibilityData,
      entityVisibilityData,
      entityMarkData,
    ] = await Promise.all([
      storage.permanentGet<BasePresetStorage<ElectricPolePreset>>(StorageKey.ELECTRIC_POLE),
      storage.permanentGet<Record<string, Record<string, boolean>>>(StorageKey.ELECTRIC_POLE_VISIBILITY),
      storage.permanentGet<BasePresetStorage<CustomPointPreset>>(StorageKey.CUSTOM_POINT),
      storage.permanentGet<Record<string, Record<string, boolean>>>(StorageKey.CUSTOM_POINT_VISIBILITY),
      storage.permanentGet<Record<string, Record<string, boolean>>>(StorageKey.LAYERS_VISIBILITY),
      storage.permanentGet<Record<string, Record<number, boolean>>>(StorageKey.MARKED_FEATURES),
    ]);

    // 1. 迁移 Electric Pole 预设和节点
    if (electricPolePresetData?.presets) {
      for (const preset of electricPolePresetData.presets) {
        // 插入预设元数据
        await this.db.electricPolePreset.insert({
          id: preset.id,
          name: preset.name,
          createdAt: preset.createdAt,
          updatedAt: preset.updatedAt,
        });

        // 插入节点数据
        if (preset.data) {
          for (const [mapId, nodes] of Object.entries(preset.data)) {
            if (!Array.isArray(nodes)) continue;
            for (const node of nodes) {
              await this.db.electricPoleNode.insert({
                id: `${preset.id}|${mapId}|${node.levelLogicId}`,
                presetId: preset.id,
                mapId,
                levelLogicId: node.levelLogicId,
                entityDataIdKey: node.entityDataIdKey,
                templateId: node.templateId,
                entityType: node.entityType,
                position: node.position,
                properties: node.properties,
              });
            }
          }
        }
      }
    }

    // 2. 迁移 Electric Pole Visibility
    if (electricPoleVisibilityData) {
      for (const [mapId, devices] of Object.entries(electricPoleVisibilityData)) {
        if (!devices || typeof devices !== 'object') continue;
        for (const [deviceKey, visible] of Object.entries(devices)) {
          await this.db.electricPoleVisibility.insert({
            id: `${mapId}|${deviceKey}`,
            entityKey: deviceKey,
            mapId,
            visible,
          });
        }
      }
    }

    // 3. 迁移 Custom Point 预设和节点
    if (customPointPresetData?.presets) {
      for (const preset of customPointPresetData.presets) {
        // 插入预设元数据
        await this.db.customPointPreset.insert({
          id: preset.id,
          name: preset.name,
          createdAt: preset.createdAt,
          updatedAt: preset.updatedAt,
        });

        // 插入节点数据
        if (preset.data) {
          for (const [mapId, nodes] of Object.entries(preset.data)) {
            if (!Array.isArray(nodes)) continue;
            for (const node of nodes) {
              await this.db.customPointNode.insert({
                id: `${preset.id}|${mapId}|${node.levelLogicId}`,
                presetId: preset.id,
                mapId,
                levelLogicId: node.levelLogicId,
                entityDataIdKey: node.entityDataIdKey,
                templateId: node.templateId,
                entityType: node.entityType,
                position: node.position,
                properties: node.properties,
              });
            }
          }
        }
      }
    }

    // 4. 迁移 Custom Point Visibility
    if (customPointVisibilityData) {
      for (const [mapId, entities] of Object.entries(customPointVisibilityData)) {
        if (!entities || typeof entities !== 'object') continue;
        for (const [entityKey, visible] of Object.entries(entities)) {
          await this.db.customPointVisibility.insert({
            id: `${mapId}|${entityKey}`,
            entityKey,
            mapId,
            visible,
          });
        }
      }
    }

    // 5. 迁移 Entity Visibility
    if (entityVisibilityData) {
      for (const [mapId, entities] of Object.entries(entityVisibilityData)) {
        if (!entities || typeof entities !== 'object') continue;
        for (const [entityKey, visible] of Object.entries(entities)) {
          await this.db.entityVisibility.insert({
            id: `${mapId}|${entityKey}`,
            entityKey,
            mapId,
            visible,
          });
        }
      }
    }

    // 6. 迁移 Entity Mark
    if (entityMarkData) {
      for (const [mapId, marks] of Object.entries(entityMarkData)) {
        if (!marks || typeof marks !== 'object') continue;
        for (const [id, marked] of Object.entries(marks)) {
          const entityId = Number(id);
          await this.db.entityMark.insert({
            id: EntityMarkService.createId(mapId, entityId),
            entityId,
            mapId,
            marked,
          });
        }
      }
    }

    // 标记迁移完成
    localStorage.setItem(Storage.MIGRATION_KEY, 'true');
    console.log('[Storage] Data migration completed successfully');
  }
}
