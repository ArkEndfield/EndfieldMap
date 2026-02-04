import { logger } from '@endfieldmap/tools';

import type { CustomPointPreset } from '@/@types/custom_point';
import type { ElectricPolePreset } from '@/@types/electric_pole';
import { alert } from '@/components/common/alert/alert_api';
import i18n from '@/i18n';
import { DataService } from '@/services/data';
import { userService } from '@/services/user';

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
/**
 * 导出 IndexedDB 数据到 JSON 文件
 */
async function exportBackup(dbName: string): Promise<void> {
  try {
    const request = window.indexedDB.open(dbName);
    request.onerror = (e) => {
      logger.error('[Storage] Failed to open database for backup', e);
      alert.info({
        content: i18n.t('migrate_tip.backup_fail') as string,
      });
    };

    request.onsuccess = async () => {
      const db = request.result;
      if (!db) {
        logger.error('[Storage] Database not found for backup');
        alert.info({
          content: i18n.t('migrate_tip.backup_fail') as string,
        });
        return;
      }
      const storeNames = Array.from(db.objectStoreNames);
      const permanentStoreName = 'permanent';
      const targetStores = storeNames.includes(permanentStoreName) ? [permanentStoreName] : [];

      if (targetStores.length === 0) {
        logger.error('[Storage] No permanent store found for backup');
        alert.info({
          content: i18n.t('migrate_tip.backup_no_store') as string,
        });
        db.close();
        return;
      }

      const transaction = db.transaction(targetStores, 'readonly');
      const store = transaction.objectStore(permanentStoreName);
      const cursorReq = store.openCursor();

      const memoryItems: Array<{ key: IDBValidKey; value: unknown }> = [];
      let totalItems = 0;

      cursorReq.onsuccess = (evt) => {
        const cursor = (evt.target as IDBRequest).result;
        if (cursor) {
          memoryItems.push({ key: cursor.key, value: cursor.value });
          totalItems++;
          cursor.continue();
        } else {
          const exportData = {
            database: dbName,
            version: db.version,
            timestamp: new Date().toISOString(),
            stores: {
              [permanentStoreName]: memoryItems,
            },
          };

          downloadData(exportData, `${dbName}_backup_${formatDate(new Date())}.json`);
          logger.log(`[Storage] Backup completed: ${totalItems} records`);
          alert.info({
            content: i18n.t('migrate_tip.backup_success') as string,
          });
          db.close();
        }
      };

      cursorReq.onerror = (err) => {
        logger.error('[Storage] Backup read failed', err);
        alert.info({
          content: i18n.t('migrate_tip.backup_fail') as string,
        });
      };
    };
  } catch (err) {
    logger.error('[Storage] Backup failed', err);
    alert.info({
      content: i18n.t('migrate_tip.backup_fail') as string,
    });
  }
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function downloadData(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function migrateToRxDB(): Promise<void> {
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
    hideCancel: false,
    cancelText: i18n.t('migrate_tip.backup') as string,
    onCancel: async () => {
      await exportBackup('endfieldmap');
      return false;
    },
    onConfirm: async () => {
      try {
        await performMigration({
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
          content: i18n.t('migrate_tip.success') as string,
        });
      } catch (error) {
        logger.error('[Storage] Data migration failed', error);
        alert.info({
          dismissible: false,
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

async function performMigration(data: MigrationData): Promise<void> {
  const storage = DataService.storage;
  const {
    electricPolePresetDataService,
    electricPoleVisibilityService,
    customPointPresetDataService,
    customPointVisibilityService,
    entityVisibilityService,
    entityMarkService,
  } = userService.data;

  // 1. 迁移 Electric Pole 预设和节点
  if (data.electricPolePresetData?.presets) {
    for (const preset of data.electricPolePresetData.presets) {
      const allNodes: any[] = [];
      // 处理旧数据结构: data 是 mapId -> nodes 的映射
      if (preset.data) {
        for (const [mapId, nodes] of Object.entries(preset.data as unknown as Record<string, any[]>)) {
          if (!Array.isArray(nodes)) continue;
          for (const node of nodes) {
            allNodes.push({
              levelLogicId: node.levelLogicId,
              entityDataIdKey: node.entityDataIdKey,
              templateId: node.templateId,
              entityType: node.entityType,
              position: node.position,
              properties: node.properties,
              mapId,
              presetId: preset.id,
            });
          }
        }
      }
      await electricPolePresetDataService.createPreset(preset.name, allNodes, {
        id: preset.id,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt,
      });
    }
    storage.permanentRemove(StorageKey.ELECTRIC_POLE);
  }

  // 2. 迁移 Electric Pole Visibility
  if (data.electricPoleVisibilityData) {
    for (const [mapId, devices] of Object.entries(data.electricPoleVisibilityData)) {
      if (!devices || typeof devices !== 'object') continue;
      for (const [deviceKey, visible] of Object.entries(devices)) {
        await electricPoleVisibilityService.setVisibilityData(mapId, deviceKey, visible);
      }
    }
    storage.permanentRemove(StorageKey.ELECTRIC_POLE_VISIBILITY);
  }

  // 3. 迁移 Custom Point 预设和节点
  if (data.customPointPresetData?.presets) {
    for (const preset of data.customPointPresetData.presets) {
      const allNodes: any[] = [];
      if (preset.data) {
        for (const [mapId, nodes] of Object.entries(preset.data as unknown as Record<string, any[]>)) {
          if (!Array.isArray(nodes)) continue;
          for (const node of nodes) {
            allNodes.push({
              levelLogicId: node.levelLogicId,
              entityDataIdKey: node.entityDataIdKey,
              templateId: node.templateId,
              entityType: node.entityType,
              position: node.position,
              properties: node.properties,
              mapId,
              presetId: preset.id,
            });
          }
        }
      }
      await customPointPresetDataService.createPreset(preset.name, allNodes, {
        id: preset.id,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt,
      });
    }
    storage.permanentRemove(StorageKey.CUSTOM_POINT);
  }

  // 4. 迁移 Custom Point Visibility
  if (data.customPointVisibilityData) {
    for (const [mapId, entities] of Object.entries(data.customPointVisibilityData)) {
      if (!entities || typeof entities !== 'object') continue;
      for (const [entityKey, visible] of Object.entries(entities)) {
        await customPointVisibilityService.setVisibilityData(mapId, entityKey, visible);
      }
    }
    storage.permanentRemove(StorageKey.CUSTOM_POINT_VISIBILITY);
  }

  // 5. 迁移 Entity Visibility
  if (data.entityVisibilityData) {
    for (const [mapId, entities] of Object.entries(data.entityVisibilityData)) {
      if (!entities || typeof entities !== 'object') continue;
      for (const [entityKey, visible] of Object.entries(entities)) {
        await entityVisibilityService.setVisibilityData(mapId, entityKey, visible);
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
        await entityMarkService.setMarkData(mapId, entityId, marked);
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
