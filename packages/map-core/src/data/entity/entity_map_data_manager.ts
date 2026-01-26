import { DEFAULT_CLUSTER_DISTANCE, MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import { EntityDataInstance } from '@endfieldmap/map-core/data/entity/entity_data_instance';
import { EntityGroupManager } from '@endfieldmap/map-core/data/entity/entity_group_manager';
import type { MapData } from '@endfieldmap/map-core/types';
import type {
  Category,
  EntityData,
  EntityInfoData,
  EntityInfoDataJson,
  EntityInfoStats,
  EntityJsonDataList,
} from '@endfieldmap/map-core/types/entity';
import { type JSONLoader, logger } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

import { MapDataManager } from '../map/map';

export interface EntityMapDataManagerConfig {
  jsonLoader: JSONLoader;
  assetPath: string;
}

/**
 * Entity地图数据管理器
 * 管理所有地图的Entity数据
 */
export class EntityMapDataManager {
  private jsonLoader: JSONLoader;
  private assetPath: string;

  /** 是否已加载 */
  public dataLoaded: boolean = false;

  /** 加载Promise */
  private loadPromise: Promise<void> | null = null;

  /** 地图数据：mapId -> entityDataIdKey -> EntityGroupManager */
  @observable
  accessor mapData: Map<MapData['id'], Map<string, EntityGroupManager>> = new Map();

  /** Entity信息数据 */
  @observable
  accessor infoData: Map<string, EntityInfoData> = new Map();

  /** 当前marked过滤模式 */
  @observable
  accessor markedFilterMode: MarkedFeatureFilterMode = MarkedFeatureFilterMode.All;

  /** 是否禁用聚合 */
  @observable
  accessor disableCluster: boolean = false;

  /** 聚合距离 */
  public clusterDistance: number = DEFAULT_CLUSTER_DISTANCE;

  /** 上次聚合距离 */
  public lastClusterDistance: number = 0;

  constructor(config: EntityMapDataManagerConfig) {
    this.jsonLoader = config.jsonLoader;
    this.assetPath = config.assetPath;
  }

  /**
   * 加载数据
   */
  public async loadData(): Promise<void> {
    if (this.dataLoaded) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.doLoadData();
    await this.loadPromise;
  }

  @action
  private async doLoadData(): Promise<void> {
    try {
      const [jsonData, infoData] = await Promise.all([
        this.jsonLoader.loadJSON<EntityJsonDataList>(`${this.assetPath}/level_entities_filtered.json`),
        this.jsonLoader.loadJSON<EntityInfoDataJson>(`${this.assetPath}/entity_info.json`),
      ]);

      // 处理info数据
      if (infoData) {
        for (const [key, info] of Object.entries(infoData)) {
          this.infoData.set(key, info);
        }
      }

      // 处理entity数据
      if (jsonData) {
        for (const mapItem of jsonData) {
          const mapId = mapItem.map_id;
          const groupManagerMap = new Map<string, EntityGroupManager>();

          const groupDataMap = new Map<string, { category: Category; entities: EntityData[] }>();

          // 收集该地图所有的entity数据，按entityDataIdKey分组，并注入entityInfo
          for (const levelItem of mapItem.levels) {
            for (const categoryItem of levelItem.categories) {
              const category = categoryItem.category;
              for (const entity of categoryItem.data) {
                const key = entity.entityDataIdKey;

                // [NEW] 将entityInfo注入到entity中
                const entityInfo = this.infoData.get(key);
                if (entityInfo) {
                  entity.entityInfo = entityInfo;
                }

                // Grouping
                let group = groupDataMap.get(key);
                if (!group) {
                  group = { category, entities: [] };
                  groupDataMap.set(key, group);
                }
                group.entities.push(entity);
              }
            }
          }

          for (const [entityDataIdKey, { category, entities }] of groupDataMap) {
            const entityInfo = this.infoData.get(entityDataIdKey);
            if (!entityInfo) {
              logger.debug(`[EntityMapDataManager] Entity info not found for ${entityDataIdKey}`);
              continue;
            }

            const groupManager = new EntityGroupManager({
              mapId,
              entityDataIdKey,
              entityInfo,
              category,
              initialData: entities,
            });

            groupManagerMap.set(entityDataIdKey, groupManager);
          }

          runInAction(() => {
            this.mapData.set(mapId, groupManagerMap);
          });
        }
      }

      this.dataLoaded = true;
      this.loadPromise = null;
    } catch (error) {
      this.loadPromise = null;
      logger.error('[EntityMapDataManager] Failed to load data', error);
      throw error;
    }
  }

  /**
   * 获取Entity信息
   */
  public getEntityInfo(entityDataIdKey: string): EntityInfoData | undefined {
    return this.infoData.get(entityDataIdKey);
  }

  /**
   * 获取地图的所有组管理器
   */
  public getMapGroupManagers(mapId: MapData['id']): Map<string, EntityGroupManager> {
    if (!this.dataLoaded) {
      throw new Error('EntityMapDataManager is not loaded');
    }
    return this.mapData.get(mapId) ?? new Map();
  }

  /**
   * 获取地图的所有组管理器数组
   */
  public getMapGroupManagerList(mapId: MapData['id']): EntityGroupManager[] {
    const managers = this.getMapGroupManagers(mapId);
    return Array.from(managers.values());
  }

  /**
   * 获取当前地图的组管理器列表
   */
  @computed
  get currentGroupManagers(): EntityGroupManager[] {
    const mapDataInstance = MapDataManager.getInstance();
    const mapId = mapDataInstance.currentMapId;
    const managers = this.mapData.get(mapId);
    return managers ? Array.from(managers.values()) : [];
  }

  /**
   * 获取当前地图的统计信息列表
   */
  @computed
  get currentStats(): EntityInfoStats[] {
    return this.currentGroupManagers.map((manager) => manager.stats);
  }

  /**
   * 设置marked过滤模式
   */
  @action
  public setMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    this.markedFilterMode = mode;
  }

  /**
   * 通过ID获取数据实例
   */
  public getInstanceById(mapId: MapData['id'], id: number): EntityDataInstance | undefined {
    const managers = this.getMapGroupManagerList(mapId);
    for (const manager of managers) {
      const instance = manager.getById(id);
      if (instance) {
        return instance;
      }
    }
    return undefined;
  }

  /**
   * 导出所有标记数据
   */
  @computed
  get markedData(): Record<MapData['id'], Record<number, boolean>> {
    const result: Record<string, Record<number, boolean>> = {};

    for (const [mapId, managers] of this.mapData) {
      result[mapId] = {};
      for (const [, manager] of managers) {
        for (const instance of manager.markedInstances) {
          result[mapId][instance.id] = true;
        }
      }
    }

    return result;
  }

  /**
   * 导入标记数据
   */
  @action
  public async importMarkedData(data: Record<MapData['id'], Record<number, boolean>>): Promise<number> {
    await this.loadData();
    let count = 0;

    for (const [mapIdStr, markedMap] of Object.entries(data)) {
      const mapId = mapIdStr as MapData['id'];
      const managers = this.mapData.get(mapId);
      if (!managers) continue;

      for (const [, manager] of managers) {
        for (const instance of manager.instances) {
          const shouldBeMarked = markedMap[instance.id] === true;
          if (instance.marked !== shouldBeMarked) {
            instance.setMarked(shouldBeMarked);
            if (shouldBeMarked) {
              count++;
            }
          }
        }
      }
    }

    return count;
  }

  /**
   * 清除所有标记
   */
  @action
  public clearAllMarked(): void {
    for (const [, managers] of this.mapData) {
      for (const [, manager] of managers) {
        manager.clearAllMarked();
      }
    }
  }

  /**
   * 导出可见性数据
   */
  @computed
  get visibilityData(): Record<MapData['id'], Record<string, boolean>> {
    const result: Record<string, Record<string, boolean>> = {};

    for (const [mapId, managers] of this.mapData) {
      result[mapId] = {};
      for (const [entityDataIdKey, manager] of managers) {
        result[mapId][entityDataIdKey] = manager.groupVisible;
      }
    }

    return result;
  }

  /**
   * 导入可见性数据
   */
  @action
  public async importVisibilityData(data: Record<MapData['id'], Record<string, boolean>>): Promise<number> {
    await this.loadData();
    let count = 0;

    for (const [mapIdStr, visibilityMap] of Object.entries(data)) {
      const mapId = mapIdStr as MapData['id'];
      const managers = this.mapData.get(mapId);
      if (!managers) continue;

      for (const [entityDataIdKey, visible] of Object.entries(visibilityMap)) {
        const manager = managers.get(entityDataIdKey);
        if (manager) {
          manager.setGroupVisible(visible);
          count++;
        }
      }
    }

    return count;
  }

  /**
   * 重置所有可见性
   */
  @action
  public resetAllVisibility(visible: boolean = false): void {
    for (const [, managers] of this.mapData) {
      for (const [, manager] of managers) {
        manager.setGroupVisible(visible);
      }
    }
  }

  @action
  public setDisableCluster(value: boolean): void {
    this.disableCluster = value;
  }
}
