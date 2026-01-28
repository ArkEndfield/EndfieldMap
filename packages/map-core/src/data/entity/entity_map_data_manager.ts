import { DEFAULT_CLUSTER_DISTANCE, MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import { EntityDataInstance } from '@endfieldmap/map-core/data/entity/entity_data_instance';
import { EntityGroupManager } from '@endfieldmap/map-core/data/entity/entity_group_manager';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { MapData } from '@endfieldmap/map-core/types';
import type {
  Category,
  EntityData,
  EntityInfoData,
  EntityInfoDataJson,
  EntityInfoStats,
  EntityJsonDataList,
} from '@endfieldmap/map-core/types/entity';
import { logger } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

/**
 * Entity地图数据管理器
 * 管理所有地图的Entity数据
 */
export class EntityMapDataManager {
  /** 是否已加载 */
  public dataLoaded: boolean = false;

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

  constructor() {}

  /**
   * 加载数据
   */
  public async loadData(jsonData: EntityJsonDataList, infoData: EntityInfoDataJson): Promise<void> {
    if (this.dataLoaded) {
      return;
    }
    try {
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
    } catch (error) {
      logger.error('[EntityMapDataManager] Failed to load data', error);
      throw error;
    }
  }

  /**
   * 获取地图的所有组管理器数组
   */
  public getMapGroupManagerList(mapId: MapData['id']): EntityGroupManager[] {
    if (!this.dataLoaded) {
      throw new Error('EntityMapDataManager is not loaded');
    }
    const managers = this.mapData.get(mapId) ?? new Map();
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
   * 导入可见性数据
   */
  @action
  public async importVisibilityData(data: Record<MapData['id'], Record<string, boolean>>): Promise<number> {
    if (!this.dataLoaded) {
      logger.warn('[EntityMapDataManager] Cannot import marked data: data not loaded');
      return 0;
    }
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

  @action
  public setDisableCluster(value: boolean): void {
    this.disableCluster = value;
  }

  @action
  public setMarked(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], marked: boolean): void {
    const instance = this.getInstanceById(mapId, levelLogicId);
    if (instance) {
      instance.setMarked(marked);
    } else {
      logger.warn(`[EntityMapDataManager] Instance not found: mapId=${mapId}, levelLogicId=${levelLogicId}`);
    }
  }

  @action
  public setVisibility(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean): void {
    const managers = this.mapData.get(mapId);
    if (!managers) {
      logger.warn(`[EntityMapDataManager] Map not found: mapId=${mapId}`);
      return;
    }
    const manager = managers.get(entityKey);
    if (manager) {
      manager.setGroupVisible(visible);
    } else {
      logger.warn(`[EntityMapDataManager] Entity group not found: mapId=${mapId}, entityKey=${entityKey}`);
    }
  }
}
