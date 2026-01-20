import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import { EntityDataInstance } from '@endfieldmap/map-core/data/entity/entity_data_instance';
import { EntityGroupManager } from '@endfieldmap/map-core/data/entity/entity_group_manager';
import type {
  Category,
  EntityData,
  EntityInfoData,
  EntityInfoDataJson,
  EntityInfoStats,
  EntityJsonDataList,
} from '@endfieldmap/map-core/types/entity';
import { groupBy, type JSONLoader, logger } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

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
  private dataLoaded: boolean = false;

  /** 加载Promise */
  private loadPromise: Promise<void> | null = null;

  /** 地图数据：mapIndex -> entityDataIdKey -> EntityGroupManager */
  @observable
  accessor mapData: Map<MapIndex, Map<string, EntityGroupManager>> = new Map();

  /** Entity信息数据 */
  @observable
  accessor infoData: Map<string, EntityInfoData> = new Map();

  /** 当前地图索引 */
  @observable
  accessor currentMapIndex: MapIndex | null = null;

  /** 当前marked过滤模式 */
  @observable
  accessor markedFilterMode: MarkedFeatureFilterMode = MarkedFeatureFilterMode.All;

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
          const mapIndex = mapItem.map_id;
          const groupManagerMap = new Map<string, EntityGroupManager>();

          // 收集该地图所有的entity数据，按entityDataIdKey分组
          const allEntities: EntityData[] = [];
          const categoryMap = new Map<string, Category>();

          for (const levelItem of mapItem.levels) {
            for (const categoryItem of levelItem.categories) {
              for (const entity of categoryItem.data) {
                allEntities.push(entity);
                categoryMap.set(entity.entityDataIdKey, categoryItem.category);
              }
            }
          }

          // 按entityDataIdKey分组
          const groupedData = groupBy(allEntities, 'entityDataIdKey');

          for (const [entityDataIdKey, entities] of Object.entries(groupedData)) {
            const entityInfo = this.infoData.get(entityDataIdKey);
            if (!entityInfo) {
              logger.debug(`[EntityMapDataManager] Entity info not found for ${entityDataIdKey}`);
              continue;
            }

            const category = categoryMap.get(entityDataIdKey);
            if (!category) {
              logger.debug(`[EntityMapDataManager] Category not found for ${entityDataIdKey}`);
              continue;
            }

            const groupManager = new EntityGroupManager({
              mapIndex,
              entityDataIdKey,
              entityInfo,
              category,
              initialData: entities,
            });

            groupManagerMap.set(entityDataIdKey, groupManager);
          }

          runInAction(() => {
            this.mapData.set(mapIndex, groupManagerMap);
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
  public async getMapGroupManagers(mapIndex: MapIndex): Promise<Map<string, EntityGroupManager>> {
    await this.loadData();
    return this.mapData.get(mapIndex) ?? new Map();
  }

  /**
   * 获取地图的所有组管理器数组
   */
  public async getMapGroupManagerList(mapIndex: MapIndex): Promise<EntityGroupManager[]> {
    const managers = await this.getMapGroupManagers(mapIndex);
    return Array.from(managers.values());
  }

  /**
   * 获取指定地图和entityDataIdKey的组管理器
   */
  public async getGroupManager(mapIndex: MapIndex, entityDataIdKey: string): Promise<EntityGroupManager | undefined> {
    const managers = await this.getMapGroupManagers(mapIndex);
    return managers.get(entityDataIdKey);
  }

  /**
   * 获取地图的按分类分组的组管理器
   */
  public async getMapCategorizedGroupManagers(mapIndex: MapIndex): Promise<Map<Category, EntityGroupManager[]>> {
    const managers = await this.getMapGroupManagerList(mapIndex);
    const categorized = new Map<Category, EntityGroupManager[]>();

    for (const manager of managers) {
      const category = manager.category;
      if (!categorized.has(category)) {
        categorized.set(category, []);
      }
      categorized.get(category)!.push(manager);
    }

    return categorized;
  }

  /**
   * 切换当前地图
   */
  @action
  public async switchMap(mapIndex: MapIndex): Promise<EntityGroupManager[]> {
    await this.loadData();
    this.currentMapIndex = mapIndex;
    return this.getMapGroupManagerList(mapIndex);
  }

  /**
   * 获取当前地图的组管理器列表
   */
  @computed
  get currentGroupManagers(): EntityGroupManager[] {
    if (!this.currentMapIndex) {
      return [];
    }
    const managers = this.mapData.get(this.currentMapIndex);
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
  public async getInstanceById(mapIndex: MapIndex, id: number): Promise<EntityDataInstance | undefined> {
    const managers = await this.getMapGroupManagerList(mapIndex);
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
  get markedData(): Record<MapIndex, Record<number, boolean>> {
    const result: Record<string, Record<number, boolean>> = {};

    for (const [mapIndex, managers] of this.mapData) {
      result[mapIndex] = {};
      for (const [, manager] of managers) {
        for (const instance of manager.markedInstances) {
          result[mapIndex][instance.id] = true;
        }
      }
    }

    return result;
  }

  /**
   * 导入标记数据
   */
  @action
  public async importMarkedData(data: Record<MapIndex, Record<number, boolean>>): Promise<number> {
    await this.loadData();
    let count = 0;

    for (const [mapIndexStr, markedMap] of Object.entries(data)) {
      const mapIndex = mapIndexStr as MapIndex;
      const managers = this.mapData.get(mapIndex);
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
  get visibilityData(): Record<MapIndex, Record<string, boolean>> {
    const result: Record<string, Record<string, boolean>> = {};

    for (const [mapIndex, managers] of this.mapData) {
      result[mapIndex] = {};
      for (const [entityDataIdKey, manager] of managers) {
        result[mapIndex][entityDataIdKey] = manager.groupVisible;
      }
    }

    return result;
  }

  /**
   * 导入可见性数据
   */
  @action
  public async importVisibilityData(data: Record<MapIndex, Record<string, boolean>>): Promise<number> {
    await this.loadData();
    let count = 0;

    for (const [mapIndexStr, visibilityMap] of Object.entries(data)) {
      const mapIndex = mapIndexStr as MapIndex;
      const managers = this.mapData.get(mapIndex);
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
}
