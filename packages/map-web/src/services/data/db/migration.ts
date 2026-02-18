import type { CustomPointPreset } from '@eftypes/custom_point';
import type { ElectricPolePreset } from '@eftypes/electric_pole';
import { downloadData, logger, StorageManager } from '@endfieldmap/tools';

import { alert } from '@/components/common/alert/alert_api';
import i18n from '@/i18n';
import type { CustomPointNodeSchemaType } from '@/services/data/db/schema/user_data/custom_point';
import type { ElectricPoleNodeSchemaType } from '@/services/data/db/schema/user_data/electric_pole';
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

interface MigrationData {
  electricPolePresetData: BasePresetStorage<ElectricPolePreset> | null;
  electricPoleVisibilityData: Record<string, Record<string, boolean>> | null;
  customPointPresetData: BasePresetStorage<CustomPointPreset> | null;
  customPointVisibilityData: Record<string, Record<string, boolean>> | null;
  entityVisibilityData: Record<string, Record<string, boolean>> | null;
  entityMarkData: Record<string, Record<number, boolean>> | null;
}

export class Migration {
  private static readonly MIGRATION_KEY = 'endfieldmap:migrated_to_rxdb';
  /**
   * 检查是否需要迁移旧数据
   */
  public static needsMigration(): boolean {
    const flag = localStorage.getItem(Migration.MIGRATION_KEY);
    return !flag?.startsWith('true');
  }

  /**
   * 执行数据迁移
   */
  public static async migrate(): Promise<void> {
    if (!Migration.needsMigration()) {
      return;
    }
    const storage = new StorageManager({
      name: 'endfieldmap',
      version: 1,
      description: 'EndfieldMap Storage',
    });
    await storage.init();

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
      localStorage.setItem(Migration.MIGRATION_KEY, 'true');
      return;
    }

    alert.confirm({
      content: i18n.t('migrate_tip.content') as string,
      dismissible: false,
      hideCancel: false,
      cancelText: i18n.t('migrate_tip.backup') as string,
      onCancel: async () => {
        await Migration.exportBackup(storage);
        return false;
      },
      onConfirm: async () => {
        try {
          await Migration.performMigration(storage, {
            electricPolePresetData,
            electricPoleVisibilityData,
            customPointPresetData,
            customPointVisibilityData,
            entityVisibilityData,
            entityMarkData,
          });

          // 标记迁移完成
          localStorage.setItem(Migration.MIGRATION_KEY, 'true');
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

  /**
   * 导出 IndexedDB 数据到 JSON 文件
   */
  private static async exportBackup(storage: StorageManager): Promise<void> {
    try {
      const memoryItems = await storage.permanentGetAllRawItems();

      const exportData = {
        database: 'endfieldmap',
        version: 1,
        timestamp: new Date().toISOString(),
        stores: {
          permanent: memoryItems,
        },
      };

      await downloadData(exportData, `endfieldmap_backup_${Migration.formatDate(new Date())}.json`);
      logger.log(`[Storage] Backup completed: ${memoryItems.length} records`);
      alert.info({
        content: i18n.t('migrate_tip.backup_success') as string,
      });
    } catch (err) {
      logger.error('[Storage] Backup failed', err);
      alert.info({
        content: i18n.t('migrate_tip.backup_fail') as string,
      });
    }
  }

  private static formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  private static async performMigration(storage: StorageManager, data: MigrationData): Promise<void> {
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
        const allNodes: Omit<ElectricPoleNodeSchemaType, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        // 处理旧数据结构: data 是 mapId -> nodes 的映射
        if (preset.data) {
          for (const [mapId, nodes] of Object.entries(
            preset.data as unknown as Record<
              string,
              Omit<ElectricPoleNodeSchemaType, 'id' | 'createdAt' | 'updatedAt'>[]
            >
          )) {
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
    }

    // 2. 迁移 Electric Pole Visibility
    if (data.electricPoleVisibilityData) {
      for (const [mapId, devices] of Object.entries(data.electricPoleVisibilityData)) {
        if (!devices || typeof devices !== 'object') continue;
        for (const [deviceKey, visible] of Object.entries(devices)) {
          await electricPoleVisibilityService.setVisibilityData(mapId, deviceKey, visible);
        }
      }
    }

    // 3. 迁移 Custom Point 预设和节点
    if (data.customPointPresetData?.presets) {
      for (const preset of data.customPointPresetData.presets) {
        const allNodes: Omit<CustomPointNodeSchemaType, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        if (preset.data) {
          for (const [mapId, nodes] of Object.entries(
            preset.data as unknown as Record<
              string,
              Omit<CustomPointNodeSchemaType, 'id' | 'createdAt' | 'updatedAt'>[]
            >
          )) {
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
    }

    // 4. 迁移 Custom Point Visibility
    if (data.customPointVisibilityData) {
      for (const [mapId, entities] of Object.entries(data.customPointVisibilityData)) {
        if (!entities || typeof entities !== 'object') continue;
        for (const [entityKey, visible] of Object.entries(entities)) {
          await customPointVisibilityService.setVisibilityData(mapId, entityKey, visible);
        }
      }
    }

    // 5. 迁移 Entity Visibility
    if (data.entityVisibilityData) {
      for (const [mapId, entities] of Object.entries(data.entityVisibilityData)) {
        if (!entities || typeof entities !== 'object') continue;
        for (const [entityKey, visible] of Object.entries(entities)) {
          await entityVisibilityService.setVisibilityData(mapId, entityKey, visible);
        }
      }
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
    }

    storage.clearAll();
  }
}
