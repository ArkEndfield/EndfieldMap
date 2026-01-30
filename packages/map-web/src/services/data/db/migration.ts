import { logger } from '@endfieldmap/tools';
import type { RxDatabase } from 'rxdb/plugins/core';

import type { CustomPointPreset } from '@/@types/custom_point';
import type { ElectricPolePreset } from '@/@types/electric_pole';
import { alert } from '@/components/common/alert/alert_api';
import i18n from '@/i18n';
import { DataService } from '@/services/data';
import type { DBCollections } from '@/services/data/db/collections.ts';
import { EntityMarkService } from '@/services/data/user/marked/entity';

enum StorageKey {
  /** 标记已获取的数据 */
  MARKED_FEATURES = 'marked_features',
  /** 筛选显示类型标点的数据 */
  LAYERS_VISIBILITY = 'layers_visibility',

  /** 电线杆数据 */
  ELECTRIC_POLE = 'electric_pole',
  /** 电线杆类型可见性 */
  ELECTRIC_POLE_VISIBILITY = 'electric_pole_visibility',
  /** 自定义标点数据 */
  CUSTOM_POINT = 'custom_point',
  /** 自定义标点类型可见性 */
  CUSTOM_POINT_VISIBILITY = 'custom_point_visibility',


  // 游戏数据（已迁移到 RxDB）
  /** ItemData */
  ITEM_DATA = 'item_data',
  /** ChestReward */
  CHEST_REWARD = 'chest_reward',
  /** DungeonSeries */
  DUNGEON_SERIES = 'dungeon_series',
  /** Guide */
  GUIDE = 'guide',
  /** DeltaRobotLevel */
  DELTA_ROBOT_LEVEL = 'delta_robot_level',
}

export interface BasePresetStorage<TPreset> {
  presets: TPreset[];
}

const MIGRATION_KEY = 'endfieldmap:migrated_to_rxdb';

/**
 * 检查是否需要迁移旧数据
 */
export function needsMigration(): boolean {
  const flag = localStorage.getItem(MIGRATION_KEY);
  return !flag?.startsWith('true');
}

/**
 * 执行数据迁移
 */
export async function migrateToRxDB(db: RxDatabase<DBCollections>): Promise<void> {
  if (!needsMigration()) {
    return;
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

  // 如果没有旧数据，直接标记迁移完成
  if (
    !electricPolePresetData &&
    !electricPoleVisibilityData &&
    !customPointPresetData &&
    !customPointVisibilityData &&
    !entityVisibilityData &&
    !entityMarkData
  ) {
    localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  alert.confirm({
    content: i18n.t('migrate_tip.content') as string,
    dismissible: false,
    hideCancel: true,
    onConfirm: async () => {
      try {
        await performMigration(db, {
          electricPolePresetData,
          electricPoleVisibilityData,
          customPointPresetData,
          customPointVisibilityData,
          entityVisibilityData,
          entityMarkData,
        });

        // 标记迁移完成
        localStorage.setItem(MIGRATION_KEY, 'true');
        logger.log('[Storage] Data migration completed successfully');
        alert.info({
          content: i18n.t('migrate_tip.susscess') as string,
        });
      } catch (error) {
        logger.error('[Storage] Data migration failed', error);
        alert.info({
          content: i18n.t('migrate_tip.fail') as string,
        });
      }
    },
  });
}

interface MigrationData {
  electricPolePresetData: BasePresetStorage<ElectricPolePreset> | null;
  electricPoleVisibilityData: Record<string, Record<string, boolean>> | null;
  customPointPresetData: BasePresetStorage<CustomPointPreset> | null;
  customPointVisibilityData: Record<string, Record<string, boolean>> | null;
  entityVisibilityData: Record<string, Record<string, boolean>> | null;
  entityMarkData: Record<string, Record<number, boolean>> | null;
}

async function performMigration(db: RxDatabase<DBCollections>, data: MigrationData): Promise<void> {
  const storage = DataService.storage;

  // 1. 迁移 Electric Pole 预设和节点
  if (data.electricPolePresetData?.presets) {
    for (const preset of data.electricPolePresetData.presets) {
      // 插入预设元数据
      await db.electricPolePreset.insert({
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
            await db.electricPoleNode.insert({
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
    storage.permanentRemove(StorageKey.ELECTRIC_POLE);
  }

  // 2. 迁移 Electric Pole Visibility
  if (data.electricPoleVisibilityData) {
    for (const [mapId, devices] of Object.entries(data.electricPoleVisibilityData)) {
      if (!devices || typeof devices !== 'object') continue;
      for (const [deviceKey, visible] of Object.entries(devices)) {
        await db.electricPoleVisibility.insert({
          id: `${mapId}|${deviceKey}`,
          entityKey: deviceKey,
          mapId,
          visible,
        });
      }
    }
    storage.permanentRemove(StorageKey.ELECTRIC_POLE_VISIBILITY);
  }

  // 3. 迁移 Custom Point 预设和节点
  if (data.customPointPresetData?.presets) {
    for (const preset of data.customPointPresetData.presets) {
      // 插入预设元数据
      await db.customPointPreset.insert({
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
            await db.customPointNode.insert({
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
    storage.permanentRemove(StorageKey.CUSTOM_POINT);
  }

  // 4. 迁移 Custom Point Visibility
  if (data.customPointVisibilityData) {
    for (const [mapId, entities] of Object.entries(data.customPointVisibilityData)) {
      if (!entities || typeof entities !== 'object') continue;
      for (const [entityKey, visible] of Object.entries(entities)) {
        await db.customPointVisibility.insert({
          id: `${mapId}|${entityKey}`,
          entityKey,
          mapId,
          visible,
        });
      }
    }
    storage.permanentRemove(StorageKey.CUSTOM_POINT_VISIBILITY);
  }

  // 5. 迁移 Entity Visibility
  if (data.entityVisibilityData) {
    for (const [mapId, entities] of Object.entries(data.entityVisibilityData)) {
      if (!entities || typeof entities !== 'object') continue;
      for (const [entityKey, visible] of Object.entries(entities)) {
        await db.entityVisibility.insert({
          id: `${mapId}|${entityKey}`,
          entityKey,
          mapId,
          visible,
        });
      }
    }
    storage.permanentRemove(StorageKey.LAYERS_VISIBILITY);
  }

  // 6. 迁移 Entity Mark
  if (data.entityMarkData) {
    for (const [mapId, marks] of Object.entries(data.entityMarkData)) {
      if (!marks || typeof marks !== 'object') continue;
      for (const [id, marked] of Object.entries(marks)) {
        const entityId = Number(id);
        await db.entityMark.insert({
          id: EntityMarkService.createId(mapId, entityId),
          entityId,
          mapId,
          marked,
        });
      }
    }
    storage.permanentRemove(StorageKey.MARKED_FEATURES);
  }

  storage.permanentRemove(StorageKey.ITEM_DATA);
  storage.permanentRemove(StorageKey.CHEST_REWARD);
  storage.permanentRemove(StorageKey.DUNGEON_SERIES);
  storage.permanentRemove(StorageKey.GUIDE);
  storage.permanentRemove(StorageKey.DELTA_ROBOT_LEVEL);
}
