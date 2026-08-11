import { DEFAULT_CLUSTER_DISTANCE, MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import { EntityDataInstance } from '@endfieldmap/map-core/data/entity/entity_data_instance';
import { EntityGroupManager } from '@endfieldmap/map-core/data/entity/entity_group_manager';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
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

  /** 地图数据管理器 */
  public readonly mapDataManager: MapDataManager;

  /** 地图数据：mapId -> entityDataIdKey -> EntityGroupManager */
  @observable
  accessor mapData: Map<MapData['id'], Map<string, EntityGroupManager>> = new Map();

  /** Entity信息数据 */
  @observable
  accessor infoData: Map<string, EntityInfoData> = new Map();

  /** 当前marked过滤模式 */
  @observable
  accessor markedFilterMode: MarkedFeatureFilterMode = MarkedFeatureFilterMode.All;

  /** 地图 level 列表：mapId -> map_level_id[] */
  @observable
  accessor mapLevelIdsByMap: Map<MapData['id'], string[]> = new Map();

  /** 选中的地图 levels：mapId -> selected map_level_id set；未设置表示全选 */
  @observable
  accessor selectedLevelIdsByMap: Map<MapData['id'], Set<string>> = new Map();

  /** 每个 Tier 区域（mapRegionId）内实体的平均高度，用于判断跨层标点相对当前层级的上下方向 */
  public readonly regionMeanY: Map<number, number> = new Map();

  /** 是否禁用聚合 */
  @observable
  accessor disableCluster: boolean = false;

  /** 聚合距离 */
  public clusterDistance: number = DEFAULT_CLUSTER_DISTANCE;

  /** 上次聚合距离 */
  public lastClusterDistance: number = 0;

  constructor(mapDataManager: MapDataManager) {
    this.mapDataManager = mapDataManager;
  }

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
        const regionYAcc = new Map<number, { sum: number; count: number }>();
        for (const mapItem of jsonData) {
          const mapId = mapItem.map_id;
          const groupManagerMap = new Map<string, EntityGroupManager>();
          const mapLevelIds: string[] = [];

          const groupDataMap = new Map<string, { category: Category; entities: EntityData[] }>();

          // 收集该地图所有的entity数据，按entityDataIdKey分组，并注入entityInfo
          for (const levelItem of mapItem.levels) {
            mapLevelIds.push(levelItem.map_level_id);
            for (const categoryItem of levelItem.categories) {
              const category = categoryItem.category;
              for (const entity of categoryItem.data) {
                const key = entity.entityDataIdKey;

                // [NEW] 将entityInfo注入到entity中
                const entityInfo = this.infoData.get(key);
                if (entityInfo) {
                  entity.entityInfo = entityInfo;
                }
                entity.mapLevelId = levelItem.map_level_id;

                if (entity.mapRegionId !== 0) {
                  const acc = regionYAcc.get(entity.mapRegionId);
                  if (acc) {
                    acc.sum += entity.position.y;
                    acc.count++;
                  } else {
                    regionYAcc.set(entity.mapRegionId, { sum: entity.position.y, count: 1 });
                  }
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
              mapDataManager: this.mapDataManager,
            });

            groupManagerMap.set(entityDataIdKey, groupManager);
          }

          runInAction(() => {
            this.mapData.set(mapId, groupManagerMap);
            this.mapLevelIdsByMap.set(mapId, mapLevelIds);
          });
        }

        for (const [regionId, { sum, count }] of regionYAcc) {
          this.regionMeanY.set(regionId, sum / count);
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
    const mapId = this.mapDataManager.currentMapId;
    const managers = this.mapData.get(mapId);
    return managers ? Array.from(managers.values()) : [];
  }

  /**
   * 获取当前地图的统计信息列表
   */
  @computed
  get currentStats(): EntityInfoStats[] {
    const mapId = this.mapDataManager.currentMapId;
    const stats: EntityInfoStats[] = [];

    for (const manager of this.currentGroupManagers) {
      // 单趟统计：原先 filter + 两次 filter 共三趟，实体量上万时纯属浪费
      let count = 0;
      let markedCount = 0;
      let selectedCount = 0;

      for (const instance of manager.instances) {
        if (!this.isLevelSelected(mapId, instance.mapLevelId)) continue;
        count++;
        if (instance.marked) markedCount++;
        if (instance.selected) selectedCount++;
      }

      if (count === 0) {
        continue;
      }

      stats.push({ ...manager.stats, count, markedCount, selectedCount });
    }

    return stats;
  }

  /**
   * 各地图 level id 的 Set 形式，供 `isLevelSelected` 免分配查询
   */
  @computed
  private get mapLevelIdSetByMap(): Map<MapData['id'], Set<string>> {
    const result = new Map<MapData['id'], Set<string>>();
    for (const [mapId, levelIds] of this.mapLevelIdsByMap) {
      result.set(mapId, new Set(levelIds));
    }
    return result;
  }

  /**
   * 获取地图的所有 level id
   */
  public getMapLevelIds(mapId: MapData['id']): string[] {
    return [...(this.mapLevelIdsByMap.get(mapId) ?? [])];
  }

  /**
   * 获取地图当前选中的 level id；未设置过时默认全选
   *
   * 返回的是副本，调用方可自由改动（`setLevelSelected` 依赖这点）。
   */
  public getSelectedLevelIds(mapId: MapData['id']): Set<string> {
    const selected = this.selectedLevelIdsByMap.get(mapId);
    return new Set(selected ?? this.getMapLevelIds(mapId));
  }

  /**
   * 判断 level 是否被选中；没有 level 维度的数据默认不被过滤
   *
   * 这是逐实体调用的热路径（每次渲染筛选都要跑满全部实体），
   * 因此直接查缓存好的 Set，不再每次构造数组 + Set。
   */
  public isLevelSelected(mapId: MapData['id'], levelId?: string): boolean {
    if (!levelId) {
      return true;
    }
    const selected = this.selectedLevelIdsByMap.get(mapId);
    if (selected) {
      return selected.has(levelId);
    }
    // 未设置过选中项 = 全选，等价于「levelId 属于该地图已知 level」
    return this.mapLevelIdSetByMap.get(mapId)?.has(levelId) ?? false;
  }

  /**
   * 设置地图选中的 levels
   */
  @action
  public setSelectedLevels(mapId: MapData['id'], levelIds: string[]): void {
    const knownLevelIds = new Set(this.getMapLevelIds(mapId));
    const selectedLevelIds = levelIds.filter((levelId) => knownLevelIds.has(levelId));
    this.selectedLevelIdsByMap.set(mapId, new Set(selectedLevelIds));
  }

  /**
   * 设置单个 level 是否选中
   */
  @action
  public setLevelSelected(mapId: MapData['id'], levelId: string, selected: boolean): void {
    const nextSelectedLevelIds = this.getSelectedLevelIds(mapId);
    if (selected) {
      nextSelectedLevelIds.add(levelId);
    } else {
      nextSelectedLevelIds.delete(levelId);
    }
    this.setSelectedLevels(mapId, [...nextSelectedLevelIds]);
  }

  /**
   * 重置地图 level 选择为全选
   */
  @action
  public resetSelectedLevels(mapId: MapData['id']): void {
    this.selectedLevelIdsByMap.delete(mapId);
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
  public setGroupVisibility(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean): void {
    const managers = this.mapData.get(mapId);
    if (!managers) {
      logger.warn(`[EntityMapDataManager] Map not found: mapId=${mapId}`);
      return;
    }
    const manager = managers.get(entityKey);
    if (manager) {
      manager.setGroupVisible(visible);
    } else {
      // 可能是尚未加载的实体或已被删除的实体对应的可见性数据，静默跳过
      logger.debug(`[EntityMapDataManager] Entity group not found: mapId=${mapId}, entityKey=${entityKey}`);
    }
  }
}
