import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { DEFAULT_CLUSTER_DISTANCE, type MapIndex, MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import { CommonPointDataManager } from '@endfieldmap/map-core/data/entity/common_point';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';
import { MultiLayerContainer } from '@endfieldmap/map-core/render/layers/multi_layer_container';
import type { ClusterOptions } from '@endfieldmap/map-core/render/source/_base';
import type { EntityVisibility, FeatureMarked, StorageData } from '@endfieldmap/map-core/types/data';
import type { EntityCategoryData, EntityData } from '@endfieldmap/map-core/types/entity';
import type { EntityVisibilityChangeEventDetail } from '@endfieldmap/map-core/types/event';
import type { JSONLoader } from '@endfieldmap/tools';
import { groupBy, logger } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

export interface EntityControllerConfig {
  jsonLoader: JSONLoader;
  dataPath: string;
  imagePath: string;
  clusterOptions?: ClusterOptions;
  disableCluster?: boolean;
}

export class EntityController {
  public commonPointDataManager: CommonPointDataManager;
  public cachedLayer: Map<MapIndex, Map<EntityCategoryData['category'], CommonPointEntityLayer[]>> = new Map();
  public imagePath: string;
  @observable accessor disableCluster: boolean;
  public entityLayerContainer: MultiLayerContainer | null = null;
  private clusterOptions: ClusterOptions;
  @observable accessor currentMapAllLayers: CommonPointEntityLayer[] = [];
  private lastDistance: number = 0;
  private currentMapIndex?: MapIndex;
  private currentZoom: number = 3;
  /** 当前 marked feature 过滤模式 */
  @observable accessor markedFilterMode: MarkedFeatureFilterMode = MarkedFeatureFilterMode.All;
  /** 待应用的图层可见性数据（用于延迟加载的地图） */
  private pendingLayerVisibility: StorageData<EntityVisibility> | null = null;
  /** 待应用的标记特征数据（用于延迟加载的地图） */
  private pendingMarkedFeatures: StorageData<FeatureMarked> | null = null;

  constructor(config: EntityControllerConfig) {
    this.commonPointDataManager = new CommonPointDataManager({
      jsonLoader: config.jsonLoader,
      assetPath: config.dataPath,
    });
    this.imagePath = config.imagePath;
    this.disableCluster = config.disableCluster ?? false;
    this.clusterOptions = {
      ...(config.clusterOptions ?? {}),
      distance: config.disableCluster ? 0 : (config.clusterOptions?.distance ?? DEFAULT_CLUSTER_DISTANCE),
    };
    this.registerEventHandler();
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandler() {
    // 缩放事件，设置聚合距离
    mapEventEmitter.on(MAP_EVENT.ZOOM_CHANGE, (zoom) => {
      this.currentZoom = zoom;
      const shouldCluster = this.shouldCluster(zoom);
      let newDistance = this.lastDistance;
      if (shouldCluster) {
        newDistance = this.clusterOptions.distance!;
      } else {
        newDistance = 0;
      }
      if (newDistance !== this.lastDistance) {
        this.lastDistance = newDistance;
        this.currentMapAllLayers.forEach((layer) => {
          layer.entity.clusterSource.setDistance(newDistance);
        });
      }
    });
  }

  /**
   * 是否需要聚合
   * @param zoom 缩放级别
   * @returns 是否需要聚合
   */
  private shouldCluster(zoom: number): boolean {
    return !this.disableCluster && zoom < 4;
  }

  /**
   * 设置是否启用聚合
   * @param enable 是否启用聚合
   */
  @action
  public setClusterEnable(enable: boolean) {
    const newDisableCluster = !enable;
    if (this.disableCluster === newDisableCluster) {
      return;
    }
    this.disableCluster = newDisableCluster;
    // 刷新聚合距离以应用更改
    this.refreshClusterDistance();
  }

  /**
   * 切换启用/关闭聚合
   */
  @action
  public toggleClusterEnable() {
    this.setClusterEnable(!this.disableCluster);
  }

  /**
   * 刷新聚合距离，根据当前设置重新计算并应用
   */
  private refreshClusterDistance() {
    const shouldCluster = this.shouldCluster(this.currentZoom);
    const newDistance = shouldCluster ? this.clusterOptions.distance! : 0;
    this.lastDistance = newDistance;
    this.currentMapAllLayers.forEach((layer) => {
      layer.entity.clusterSource.setDistance(newDistance);
    });
  }

  /**
   * 初始化聚合距离，根据当前zoom级别设置
   */
  private initClusterDistance() {
    const shouldCluster = this.shouldCluster(this.currentZoom);
    const newDistance = shouldCluster ? this.clusterOptions.distance! : 0;

    this.lastDistance = newDistance;
    this.currentMapAllLayers.forEach((layer) => {
      layer.entity.clusterSource.setDistance(newDistance);
    });
  }

  /**
   * 将当前 marked 过滤模式应用到指定图层列表
   */
  private applyMarkedFilterModeToLayers(layers: CommonPointEntityLayer[]) {
    layers.forEach((layer) => {
      layer.setMarkedFilterMode(this.markedFilterMode);
    });
  }

  /**
   * 通知实体可见性变化
   */
  private notifyEntityVisibilityChange(event: EntityVisibilityChangeEventDetail) {
    mapEventEmitter.fire(MAP_EVENT.ENTITY_VISIBILITY_CHANGE, event);
  }

  /**
   * 获取实体图层
   * @param mapIndex 地图索引
   * @returns 实体图层
   */
  public async getMapLayers(mapIndex: MapIndex): Promise<CommonPointEntityLayer[]> {
    if (this.cachedLayer.has(mapIndex)) {
      return Array.from(this.cachedLayer.get(mapIndex)!.values()).flat();
    } else {
      const data = await this.commonPointDataManager.getCategoryData(mapIndex);
      const layers: Map<EntityCategoryData['category'], CommonPointEntityLayer[]> = new Map();
      const currentLayers: CommonPointEntityLayer[] = [];
      for (const [category, entities] of data) {
        const infoDataGroup = groupBy(entities, 'entityDataIdKey');
        const groupEntries = Object.entries(infoDataGroup);
        for (const [id, entities] of groupEntries) {
          const infoData = await this.commonPointDataManager.getInfoData(id);
          if (!infoData) continue;
          const layer = new CommonPointEntityLayer({
            name: infoData.entityInfo.pic,
            infoData: infoData,
            icon: {
              url: `${this.imagePath}/${infoData.entityInfo.pic}.png`,
            },
            data: entities,
            mapIndex: mapIndex,
            clusterOptions: this.clusterOptions,
            renderBuffer: 250,
          });
          // 应用当前 marked feature 过滤模式
          layer.setMarkedFilterMode(this.markedFilterMode);
          // 将 layer 添加到全局列表中
          currentLayers.push(layer);
          layers.set(category, [...(layers.get(category) || []), layer]);
        }
      }
      this.cachedLayer.set(mapIndex, layers);

      // 应用待处理的图层可见性数据
      if (this.pendingLayerVisibility && this.pendingLayerVisibility[mapIndex]) {
        const layerVisibilityMap = this.pendingLayerVisibility[mapIndex];
        currentLayers.forEach((layer) => {
          const layerKey = layer.entityDataIdKey;
          if (layerKey in layerVisibilityMap) {
            layer.setVisible(layerVisibilityMap[layerKey]);
          }
        });
      }

      // 应用待处理的标记特征数据
      if (this.pendingMarkedFeatures && this.pendingMarkedFeatures[mapIndex]) {
        const markedLogicIdMap = this.pendingMarkedFeatures[mapIndex];
        currentLayers.forEach((layer) => {
          layer.entity.features.forEach((feature) => {
            const levelLogicId = feature.data.levelLogicId;
            const shouldBeMarked = markedLogicIdMap[levelLogicId] === true;
            if (shouldBeMarked) {
              feature.setMarked(true);
            }
          });
        });
      }

      return Array.from(layers.values()).flat();
    }
  }

  /**
   * 获取实体图层
   * @param mapIndex 地图索引
   * @returns 实体图层
   */
  @action
  public async switchMapLayers(mapIndex: MapIndex): Promise<CommonPointEntityLayer[]> {
    if (this.currentMapIndex === mapIndex) return this.currentMapAllLayers;
    this.currentMapIndex = mapIndex;
    const layers = await this.getMapLayers(mapIndex);
    runInAction(() => {
      this.currentMapAllLayers = layers;
      // 确保切换地图后，新的图层也应用当前的 marked 过滤模式
      this.applyMarkedFilterModeToLayers(layers);
      this.entityLayerContainer = new MultiLayerContainer(layers.map((layer) => layer.layer));
    });
    // 初始化聚合距离，确保图层创建后立即应用正确的聚合设置
    this.initClusterDistance();
    return layers;
  }

  // #region 实体图层可见性操作

  /**
   * 显示实体图层
   * @param category 实体分类
   * @param entityDataIdKey 实体数据ID
   */
  @action
  public showEntity(entityDataIdKey: EntityData['entityDataIdKey']) {
    const layer = this.currentMapAllLayers.find((layer) => layer.entityDataIdKey === entityDataIdKey);
    if (!layer) return;
    layer.setVisible(true);
    this.notifyEntityVisibilityChange({
      batch: false,
      visible: true,
      layers: [layer],
      changes: [{ layer, visible: true }],
    });
  }

  /**
   * 隐藏实体图层
   * @param entityDataIdKey 实体数据ID
   */
  @action
  public hideEntity(entityDataIdKey: EntityData['entityDataIdKey']) {
    const layer = this.currentMapAllLayers.find((layer) => layer.entityDataIdKey === entityDataIdKey);
    if (!layer) return;
    layer.setVisible(false);
    this.notifyEntityVisibilityChange({
      batch: false,
      visible: false,
      layers: [layer],
      changes: [{ layer, visible: false }],
    });
  }

  /**
   * 切换实体图层的可见性
   * @param entityDataIdKey 实体数据ID
   */
  @action
  public toggleEntityVisible(entityDataIdKey: EntityData['entityDataIdKey']) {
    const layer = this.currentMapAllLayers.find((layer) => layer.entityDataIdKey === entityDataIdKey);
    if (!layer) {
      logger.warn(
        `[EntityController|toggleEntityVisible] Entity layer not found for entity data id key: ${entityDataIdKey}`
      );
      return;
    }
    const newVisible = !layer.visible;
    layer.setVisible(newVisible);
    this.notifyEntityVisibilityChange({
      batch: false,
      visible: newVisible,
      layers: [layer],
      changes: [{ layer, visible: newVisible }],
    });
  }

  /**
   * 显示所有实体图层
   */
  @action
  public showAllEntities() {
    const affectedLayers = this.currentMapAllLayers.filter((layer) => !layer.visible);
    affectedLayers.forEach((layer) => {
      layer.setVisible(true);
    });
    if (affectedLayers.length > 0) {
      this.notifyEntityVisibilityChange({
        batch: true,
        visible: true,
        layers: affectedLayers,
        changes: affectedLayers.map((layer) => ({ layer, visible: true })),
      });
    }
  }

  /**
   * 隐藏所有实体图层
   */
  @action
  public hideAllEntities() {
    const affectedLayers = this.currentMapAllLayers.filter((layer) => layer.visible);
    affectedLayers.forEach((layer) => {
      layer.setVisible(false);
    });
    if (affectedLayers.length > 0) {
      this.notifyEntityVisibilityChange({
        batch: true,
        visible: false,
        layers: affectedLayers,
        changes: affectedLayers.map((layer) => ({ layer, visible: false })),
      });
    }
  }
  /**
   * 切换实体图层的可见性
   * @param entityDataIdKey 实体数据ID
   */
  @action
  public toggleAllEntityVisible() {
    const changes = this.currentMapAllLayers.map((layer) => {
      const newVisible = !layer.visible;
      layer.setVisible(newVisible);
      return { layer, visible: newVisible };
    });
    if (changes.length > 0) {
      this.notifyEntityVisibilityChange({
        batch: true,
        visible: false, // 对于切换操作，这个字段没有明确的意义
        layers: this.currentMapAllLayers,
        changes,
      });
    }
  }

  /**
   * 显示分类中的所有实体图层
   * @param category 实体分类
   */
  @action
  public showCategoryEntities(category: EntityCategoryData['category']) {
    const layers = this.currentMapAllLayers.filter((layer) => layer.infoData.category === category);
    const affectedLayers = layers.filter((layer) => !layer.visible);
    affectedLayers.forEach((layer) => {
      layer.setVisible(true);
    });
    if (affectedLayers.length > 0) {
      this.notifyEntityVisibilityChange({
        batch: true,
        visible: true,
        layers: affectedLayers,
        changes: affectedLayers.map((layer) => ({ layer, visible: true })),
      });
    }
  }

  /**
   * 隐藏分类中的所有实体图层
   * @param category 实体分类
   */
  @action
  public hideCategoryEntities(category: EntityCategoryData['category']) {
    const layers = this.currentMapAllLayers.filter((layer) => layer.infoData.category === category);
    const affectedLayers = layers.filter((layer) => layer.visible);
    affectedLayers.forEach((layer) => {
      layer.setVisible(false);
    });
    if (affectedLayers.length > 0) {
      this.notifyEntityVisibilityChange({
        batch: true,
        visible: false,
        layers: affectedLayers,
        changes: affectedLayers.map((layer) => ({ layer, visible: false })),
      });
    }
  }

  /**
   * 切换分类中的所有实体图层的可见性
   * @param category 实体分类
   */
  @action
  public toggleCategoryEntityVisible(category: EntityCategoryData['category']) {
    const layers = this.currentMapAllLayers.filter((layer) => layer.infoData.category === category);
    const changes = layers.map((layer) => {
      const newVisible = !layer.visible;
      layer.setVisible(newVisible);
      return { layer, visible: newVisible };
    });
    if (changes.length > 0) {
      this.notifyEntityVisibilityChange({
        batch: true,
        visible: false, // 对于切换操作，这个字段没有明确的意义
        layers,
        changes,
      });
    }
  }

  // #region marked feature 过滤

  /**
   * 设置 marked feature 的全局过滤模式
   * @param mode 过滤模式
   */
  @action
  public setMarkedFeatureFilter(mode: MarkedFeatureFilterMode) {
    if (this.markedFilterMode === mode) {
      return;
    }
    this.markedFilterMode = mode;

    // 应用到当前地图的所有图层
    this.applyMarkedFilterModeToLayers(this.currentMapAllLayers);

    // 同步到已缓存的其它地图图层
    for (const [, categoryMap] of this.cachedLayer.entries()) {
      for (const [, layers] of categoryMap.entries()) {
        this.applyMarkedFilterModeToLayers(layers);
      }
    }
  }

  /**
   * 仅显示已标记的 feature
   */
  @action
  public showOnlyMarkedFeatures() {
    this.setMarkedFeatureFilter(MarkedFeatureFilterMode.Marked);
  }

  /**
   * 仅显示未标记的 feature
   */
  @action
  public showOnlyUnmarkedFeatures() {
    this.setMarkedFeatureFilter(MarkedFeatureFilterMode.Unmarked);
  }

  /**
   * 显示所有 feature（不按 marked 过滤）
   */
  @action
  public showAllFeatures() {
    this.setMarkedFeatureFilter(MarkedFeatureFilterMode.All);
  }

  // #endregion

  /**
   * 获取当前地图的所有实体信息列表
   * @returns 实体信息列表
   */
  @computed
  get currentEntityInfoList() {
    return this.currentMapAllLayers.map((layer) => layer.entityInfo);
  }

  /**
   * 获取地图的分类后所有实体信息列表
   * @param mapIndex 地图索引
   * @returns 实体信息列表
   */
  @action
  async getMapCategorizedEntityInfoList(mapIndex: MapIndex) {
    const layers = await this.getMapEntityInfoList(mapIndex);
    return groupBy(layers, 'category');
  }

  /**
   * 获取地图的实体信息列表
   * @param mapIndex 地图索引
   * @returns 实体信息列表
   */
  @action
  async getMapEntityInfoList(mapIndex: MapIndex) {
    const layers = await this.getMapLayers(mapIndex);
    return layers.map((layer) => layer.entityInfo);
  }

  public clearAllMarked(): void {
    try {
      for (const [_, categoryMap] of this.cachedLayer.entries()) {
        for (const [_, layers] of categoryMap.entries()) {
          for (const layer of layers) {
            layer.entity.features.forEach((feature) => {
              if (feature.marked) {
                feature.setMarked(false);
              }
            });
          }
        }
      }
    } catch (error) {
      logger.error('[DataController|clearAllMarked] Failed to clear marked entities', error);
      throw error;
    }
  }

  /**
   * 重置所有layer的可见性，将所有layer的visible状态设置为默认值
   * @param visible 默认可见性
   */
  public resetAllLayerVisibility(visible: boolean = false): void {
    try {
      for (const [_, categoryMap] of this.cachedLayer.entries()) {
        for (const [_, layers] of categoryMap.entries()) {
          for (const layer of layers) {
            layer.setVisible(visible);
          }
        }
      }
    } catch (error) {
      logger.error('[DataController|resetAllLayerVisibility] Failed to reset layer visibility', error);
      throw error;
    }
  }
  // #endregion

  // #region 数据处理

  /**
   * 导出层级可见性数据
   * @returns 层级可见性数据
   */
  public exportLayerVisibility(): StorageData<EntityVisibility> {
    try {
      const layerVisibility = {} as StorageData<EntityVisibility>;

      // 遍历所有缓存的地图层
      for (const [mapIndex, categoryMap] of this.cachedLayer.entries()) {
        // 初始化该地图的数据
        layerVisibility[mapIndex] = {};

        // 遍历该地图的所有分类层
        for (const [_, layers] of categoryMap.entries()) {
          for (const layer of layers) {
            // 收集layer的可见性状态
            const layerKey = layer.entityDataIdKey;
            layerVisibility[mapIndex][layerKey] = layer.visible;
          }
        }
      }
      return layerVisibility;
    } catch (error) {
      logger.error('[DataController|exportLayerVisibility] Failed to export layer visibility', error);
      throw error;
    }
  }

  /**
   * 导入层级可见性数据
   * @param layerVisibility 层级可见性数据
   * @returns 导入的层级数量
   */
  public importLayerVisibility(layerVisibility: StorageData<EntityVisibility>): number {
    try {
      // 验证
      if (!this.validateLayerVisibility(layerVisibility)) {
        logger.error('[DataController|importLayerVisibility] Invalid layer visibility data');
        // TODO: i18n
        throw new Error('Invalid layer visibility data');
      }

      // 保存待应用的数据，用于延迟加载的地图
      this.pendingLayerVisibility = layerVisibility;

      let layerCount = 0;
      // 遍历所有缓存的地图层
      for (const [mapIndex, categoryMap] of this.cachedLayer.entries()) {
        const layerVisibilityMap = layerVisibility[mapIndex] || {};
        // 遍历该地图的所有分类层
        for (const [_, layers] of categoryMap.entries()) {
          for (const layer of layers) {
            const layerKey = layer.entityDataIdKey;

            // 恢复layer的可见性
            if (layerKey in layerVisibilityMap) {
              layer.setVisible(layerVisibilityMap[layerKey]);
              layerCount++;
            }
          }
        }
      }
      return layerCount;
    } catch (error) {
      logger.error('[DataController|importLayerVisibility] Failed to import layer visibility', error);
      throw error;
    }
  }

  /**
   * 验证层级可见性数据格式
   * @param layerVisibility 要验证的层级可见性数据
   * @returns 数据是否有效
   */
  public validateLayerVisibility(layerVisibility: unknown): layerVisibility is StorageData<EntityVisibility> {
    if (!layerVisibility || typeof layerVisibility !== 'object') {
      return false;
    }

    const obj = layerVisibility as Record<string, unknown>;
    for (const key in obj) {
      if (typeof obj[key] !== 'object') {
        return false;
      }
    }

    return true;
  }

  /**
   * 导出标记的feature数据
   * @returns 标记的feature数据
   */
  public exportMarkedFeatures(): StorageData<FeatureMarked> {
    try {
      const markedFeatures: StorageData<FeatureMarked> = {};

      // 遍历所有缓存的地图层
      for (const [mapIndex, categoryMap] of this.cachedLayer.entries()) {
        // 初始化该地图的数据
        markedFeatures[mapIndex] = {};

        // 遍历该地图的所有分类层
        for (const [_, layers] of categoryMap.entries()) {
          for (const layer of layers) {
            // 收集该层中所有marked的entity的levelLogicId
            const layerMarkedFeatures = layer.entity.features
              .filter((feature) => feature.marked)
              .map((feature) => feature.data.levelLogicId)
              .reduce((acc, levelLogicId) => {
                acc[levelLogicId] = true;
                return acc;
              }, {} as FeatureMarked);

            Object.assign(markedFeatures[mapIndex], layerMarkedFeatures);
          }
        }
      }

      return markedFeatures;
    } catch (error) {
      logger.error('[DataController|exportMarkedEntities] Failed to export marked entities', error);
      throw error;
    }
  }

  /**
   * 验证标记的实体数据格式
   * @param markedFeatures 要验证的标记数据
   * @returns 数据是否有效
   */
  public validateMarkedFeatures(markedFeatures: unknown): markedFeatures is StorageData<FeatureMarked> {
    if (!markedFeatures || typeof markedFeatures !== 'object') {
      return false;
    }

    const obj = markedFeatures as Record<string, unknown>;
    for (const key in obj) {
      if (typeof obj[key] !== 'object' || obj[key] === null) {
        return false;
      }
    }

    return true;
  }

  /**
   * 导入标记的实体数据
   * @param markedFeatures 标记的实体数据
   * @returns 导入的标记数量
   */
  public importMarkedFeatures(markedFeatures: StorageData<FeatureMarked>): number {
    try {
      // 保存待应用的数据，用于延迟加载的地图
      this.pendingMarkedFeatures = markedFeatures;

      let markedCount = 0;

      // 遍历所有缓存的地图层
      for (const [mapIndex, categoryMap] of this.cachedLayer.entries()) {
        const markedLogicIdMap = markedFeatures[mapIndex] || {};

        // 遍历该地图的所有分类层
        for (const [_, layers] of categoryMap.entries()) {
          for (const layer of layers) {
            // 恢复entity的marked状态
            layer.entity.features.forEach((feature) => {
              const levelLogicId = feature.data.levelLogicId;
              const shouldBeMarked = markedLogicIdMap[levelLogicId] === true;

              if (feature.marked !== shouldBeMarked) {
                feature.setMarked(shouldBeMarked);
                if (shouldBeMarked) {
                  markedCount++;
                }
              }
            });
          }
        }
      }
      return markedCount;
    } catch (error) {
      logger.error('[DataController|importMarkedEntities] Failed to import marked entities', error);
      throw error;
    }
  }
  // #endregion
}
