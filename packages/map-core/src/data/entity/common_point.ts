import type {
  EntityCategoryData,
  EntityDataList,
  EntityInfoData,
  EntityInfoDataJson,
  EntityInfoKey,
  EntityJsonDataList,
  EntityLevelData,
  MapData,
} from '@endfieldmap/map-core/types';
import { type JSONLoader, logger } from '@endfieldmap/tools';

export interface CommonPointDataManagerConfig {
  jsonLoader: JSONLoader;
  assetPath: string;
}

export type EntityDataMap = Map<
  MapData['id'],
  Map<EntityLevelData['map_level_id'], Map<EntityCategoryData['category'], EntityDataList>>
>;

export class CommonPointDataManager {
  public data: EntityDataMap = new Map();
  public infoData: Map<EntityInfoKey, EntityInfoData> = new Map();
  private jsonLoader: JSONLoader;
  private assetPath: string;
  private dataLoaded: boolean = false;
  private loadPromise: Promise<{ data: EntityDataMap; infoData: Map<EntityInfoKey, EntityInfoData> }> | null = null;

  constructor(config: CommonPointDataManagerConfig) {
    this.jsonLoader = config.jsonLoader;
    this.assetPath = config.assetPath;
  }

  async loadData() {
    if (this.dataLoaded) {
      return {
        data: this.data,
        infoData: this.infoData,
      };
    }

    if (this.loadPromise) {
      return await this.loadPromise;
    }

    this.loadPromise = (async () => {
      const dataPromise = Promise.all([
        this.jsonLoader.loadJSON<EntityJsonDataList>(`${this.assetPath}/level_entities_filtered.json`),
        this.jsonLoader.loadJSON<EntityInfoDataJson>(`${this.assetPath}/entity_info.json`),
      ]);
      const [data, infoData] = await dataPromise;

      if (data) {
        data.forEach((item) => {
          const mapData = new Map<
            EntityLevelData['map_level_id'],
            Map<EntityCategoryData['category'], EntityDataList>
          >();
          item.levels.forEach((level) => {
            const categoryData = new Map<EntityCategoryData['category'], EntityDataList>();
            level.categories.forEach((category) => {
              categoryData.set(category.category, category.data);
            });
            mapData.set(level.map_level_id, categoryData);
          });
          this.data.set(item.map_id, mapData);
        });
      }
      if (infoData) {
        Object.entries(infoData).forEach(([category, info]) => {
          this.infoData.set(category, info);
        });
      }

      this.dataLoaded = true;
      this.loadPromise = null;

      return {
        data: this.data,
        infoData: this.infoData,
      };
    })();

    return await this.loadPromise;
  }

  /**
   * 获取地图所有实体数据
   * @param mapId 地图索引
   * @returns 地图所有实体数据
   */
  public async getData(mapId: MapData['id']) {
    await this.loadData();
    if (this.data.has(mapId)) {
      return this.data.get(mapId)!;
    }
    logger.warn(`Map data not found for map index: ${mapId}`);
    return new Map() as Map<EntityLevelData['map_level_id'], Map<EntityCategoryData['category'], EntityDataList>>;
  }

  /**
   * 获取实体信息数据
   * @param category 实体分类
   * @returns 实体信息数据
   */
  public async getInfoData(category: EntityInfoKey) {
    await this.loadData();
    if (this.infoData.has(category)) {
      return this.infoData.get(category)!;
    }
    logger.debug(`Entity info data not found for category: ${category}`);
  }

  /**
   * 获取地图所有实体数据（分类）
   * @param mapId 地图索引
   * @returns 地图所有实体数据（分类）
   */
  public async getCategoryData(mapId: MapData['id']) {
    const data = await this.getData(mapId);
    const categoryData: Map<EntityCategoryData['category'], EntityDataList> = new Map();

    data.forEach((levelData) => {
      levelData.forEach((entities, category) => {
        if (!categoryData.has(category)) {
          categoryData.set(category, []);
        }
        categoryData.get(category)!.push(...entities);
      });
    });

    return categoryData;
  }

  /**
   * 获取地图所有实体数据（扁平化）
   * @param mapId 地图索引
   * @returns 地图所有实体数据（扁平化）
   */
  public async getDataFlat(mapId: MapData['id']) {
    const data = await this.getData(mapId);
    const flatData: EntityDataList = [];
    data.forEach((levelData) => {
      Array.from(levelData.values()).forEach((categoryData) => {
        flatData.push(...categoryData);
      });
    });
    return flatData;
  }
}
