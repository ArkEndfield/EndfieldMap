import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { DEFAULT_CLUSTER_DISTANCE, type MapIndex, MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import type { EntityGroupManager, EntityInfoStats } from '@endfieldmap/map-core/data/entity';
import { EntityMapDataManager } from '@endfieldmap/map-core/data/entity';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { MultiLayerContainer } from '@endfieldmap/map-core/render/layers/multi_layer_container';
import { EntityGroupRenderer } from '@endfieldmap/map-core/render/renderer';
import type { EntityVisibility, FeatureMarked, StorageData } from '@endfieldmap/map-core/types/data';
import type { JSONLoader } from '@endfieldmap/tools';
import { groupBy, logger } from '@endfieldmap/tools';
import { action, computed, type IReactionDisposer,observable } from 'mobx';

/**
 * Entity控制器配置
 */
export interface EntityControllerConfig {
  /** JSON加载器 */
  jsonLoader: JSONLoader;
  /** 数据路径 */
  dataPath: string;
  /** 图片路径 */
  imagePath: string;
  /** 聚合距离 */
  clusterDistance?: number;
  /** 是否禁用聚合 */
  disableCluster?: boolean;
}

/**
 * Entity控制器
 * 负责协调EntityDataManager和EntityRenderer
 * 提供给UI层访问数据的接口
 */
export class EntityController {
  /** 数据管理器 */
  public readonly dataManager: EntityMapDataManager;

  /** 图片路径 */
  private readonly imagePath: string;

  /** 聚合距离 */
  private clusterDistance: number;

  /** 是否禁用聚合 */
  @observable
  accessor disableCluster: boolean;

  /** 渲染器缓存：mapIndex -> entityDataIdKey -> renderer */
  private rendererCache: Map<MapIndex, Map<string, EntityGroupRenderer>> = new Map();

  /** 当前地图的所有渲染器 */
  @observable
  accessor currentRenderers: EntityGroupRenderer[] = [];

  /** 当前图层容器 */
  public layerContainer: MultiLayerContainer | null = null;

  /** 当前地图索引 */
  private currentMapIndex?: MapIndex;

  /** 当前缩放级别 */
  private currentZoom: number = 3;

  /** 上次聚合距离 */
  private lastClusterDistance: number = 0;

  /** 当前marked过滤模式 */
  @observable
  accessor markedFilterMode: MarkedFeatureFilterMode = MarkedFeatureFilterMode.All;

  /** 待应用的可见性数据 */
  private pendingVisibility: StorageData<EntityVisibility> | null = null;

  /** 待应用的标记数据 */
  private pendingMarked: StorageData<FeatureMarked> | null = null;

  /** MobX disposers */
  private disposers: IReactionDisposer[] = [];

  constructor(config: EntityControllerConfig) {
    this.dataManager = new EntityMapDataManager({
      jsonLoader: config.jsonLoader,
      assetPath: config.dataPath,
    });
    this.imagePath = config.imagePath;
    this.clusterDistance = config.clusterDistance ?? DEFAULT_CLUSTER_DISTANCE;
    this.disableCluster = config.disableCluster ?? false;

    this.registerEventHandlers();
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers(): void {
    // 监听缩放变化
    mapEventEmitter.on(MAP_EVENT.ZOOM_CHANGE, (zoom) => {
      this.currentZoom = zoom;
      this.updateClusterDistance();
    });
  }

  /**
   * 是否应该启用聚合
   */
  private shouldCluster(zoom: number): boolean {
    return !this.disableCluster && zoom < 4;
  }

  /**
   * 更新聚合距离
   */
  private updateClusterDistance(): void {
    const shouldCluster = this.shouldCluster(this.currentZoom);
    const newDistance = shouldCluster ? this.clusterDistance : 0;

    if (newDistance !== this.lastClusterDistance) {
      this.lastClusterDistance = newDistance;
      for (const renderer of this.currentRenderers) {
        renderer.setClusterDistance(newDistance);
      }
    }
  }

  /**
   * 设置是否启用聚合
   */
  @action
  public setClusterEnable(enable: boolean): void {
    const newDisableCluster = !enable;
    if (this.disableCluster === newDisableCluster) {
      return;
    }
    this.disableCluster = newDisableCluster;
    this.updateClusterDistance();
  }

  /**
   * 切换聚合启用状态
   */
  @action
  public toggleClusterEnable(): void {
    this.setClusterEnable(this.disableCluster);
  }

  /**
   * 获取地图的渲染器
   */
  private async getMapRenderers(mapIndex: MapIndex): Promise<EntityGroupRenderer[]> {
    if (this.rendererCache.has(mapIndex)) {
      return Array.from(this.rendererCache.get(mapIndex)!.values());
    }

    // 获取数据管理器
    const groupManagers = await this.dataManager.getMapGroupManagerList(mapIndex);
    const rendererMap = new Map<string, EntityGroupRenderer>();

    for (const manager of groupManagers) {
      const renderer = new EntityGroupRenderer({
        dataManager: manager,
        iconPath: `${this.imagePath}/${manager.iconName}.png`,
        enableCluster: !this.disableCluster,
        clusterDistance: this.clusterDistance,
      });

      // 应用当前marked过滤模式
      renderer.setMarkedFilterMode(this.markedFilterMode);

      rendererMap.set(manager.entityDataIdKey, renderer);
    }

    this.rendererCache.set(mapIndex, rendererMap);

    // 应用待处理的可见性数据
    if (this.pendingVisibility && this.pendingVisibility[mapIndex]) {
      const visibilityMap = this.pendingVisibility[mapIndex]!;
      for (const [entityDataIdKey, visible] of Object.entries(visibilityMap)) {
        const manager = groupManagers.find((m) => m.entityDataIdKey === entityDataIdKey);
        if (manager) {
          manager.setGroupVisible(visible);
        }
      }
    }

    // 应用待处理的标记数据
    if (this.pendingMarked && this.pendingMarked[mapIndex]) {
      const markedMap = this.pendingMarked[mapIndex]!;
      for (const manager of groupManagers) {
        for (const instance of manager.instances) {
          if (markedMap[instance.id] === true) {
            instance.setMarked(true);
          }
        }
      }
    }

    return Array.from(rendererMap.values());
  }

  /**
   * 切换地图
   */
  @action
  public async switchMap(mapIndex: MapIndex): Promise<EntityGroupRenderer[]> {
    if (this.currentMapIndex === mapIndex) {
      return this.currentRenderers;
    }

    this.currentMapIndex = mapIndex;
    await this.dataManager.switchMap(mapIndex);

    const renderers = await this.getMapRenderers(mapIndex);

    this.currentRenderers = renderers;
    this.layerContainer = new MultiLayerContainer(renderers.map((r) => r.layer));

    // 应用marked过滤模式
    this.applyMarkedFilterMode(renderers);

    // 更新聚合距离
    this.updateClusterDistance();

    return renderers;
  }

  /**
   * 应用marked过滤模式到渲染器
   */
  private applyMarkedFilterMode(renderers: EntityGroupRenderer[]): void {
    for (const renderer of renderers) {
      renderer.setMarkedFilterMode(this.markedFilterMode);
    }
  }

  // #region 可见性操作

  /**
   * 显示实体
   */
  @action
  public showEntity(entityDataIdKey: string): void {
    const manager = this.dataManager.currentGroupManagers.find((m) => m.entityDataIdKey === entityDataIdKey);
    if (!manager) return;

    manager.setGroupVisible(true);
  }

  /**
   * 隐藏实体
   */
  @action
  public hideEntity(entityDataIdKey: string): void {
    const manager = this.dataManager.currentGroupManagers.find((m) => m.entityDataIdKey === entityDataIdKey);
    if (!manager) return;

    manager.setGroupVisible(false);
  }

  /**
   * 切换实体可见性
   */
  @action
  public toggleEntityVisible(entityDataIdKey: string): void {
    const manager = this.dataManager.currentGroupManagers.find((m) => m.entityDataIdKey === entityDataIdKey);
    if (!manager) {
      logger.warn(`[EntityController] Manager not found for ${entityDataIdKey}`);
      return;
    }

    const newVisible = !manager.groupVisible;
    manager.setGroupVisible(newVisible);
  }

  /**
   * 显示所有实体
   */
  @action
  public showAllEntities(): void {
    const managers = this.dataManager.currentGroupManagers;
    const affected = managers.filter((m) => !m.groupVisible);
    for (const manager of affected) {
      manager.setGroupVisible(true);
    }
  }

  /**
   * 隐藏所有实体
   */
  @action
  public hideAllEntities(): void {
    const managers = this.dataManager.currentGroupManagers;
    const affected = managers.filter((m) => m.groupVisible);
    for (const manager of affected) {
      manager.setGroupVisible(false);
    }
  }

  /**
   * 显示分类实体
   */
  @action
  public showCategoryEntities(category: string): void {
    const managers = this.dataManager.currentGroupManagers.filter((m) => m.category === category);
    const affected = managers.filter((m) => !m.groupVisible);
    for (const manager of affected) {
      manager.setGroupVisible(true);
    }
  }

  /**
   * 隐藏分类实体
   */
  @action
  public hideCategoryEntities(category: string): void {
    const managers = this.dataManager.currentGroupManagers.filter((m) => m.category === category);
    const affected = managers.filter((m) => m.groupVisible);
    for (const manager of affected) {
      manager.setGroupVisible(false);
    }
  }

  // #endregion

  // #region Marked过滤

  /**
   * 设置marked过滤模式
   */
  @action
  public setMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    if (this.markedFilterMode === mode) {
      return;
    }
    this.markedFilterMode = mode;
    this.dataManager.setMarkedFilterMode(mode);

    // 应用到当前渲染器
    this.applyMarkedFilterMode(this.currentRenderers);

    // 应用到所有缓存的渲染器
    for (const [, rendererMap] of this.rendererCache) {
      for (const [, renderer] of rendererMap) {
        renderer.setMarkedFilterMode(mode);
      }
    }
  }

  /**
   * 仅显示已标记
   */
  @action
  public showOnlyMarked(): void {
    this.setMarkedFilterMode(MarkedFeatureFilterMode.Marked);
  }

  /**
   * 仅显示未标记
   */
  @action
  public showOnlyUnmarked(): void {
    this.setMarkedFilterMode(MarkedFeatureFilterMode.Unmarked);
  }

  /**
   * 显示全部
   */
  @action
  public showAll(): void {
    this.setMarkedFilterMode(MarkedFeatureFilterMode.All);
  }

  // #endregion

  // #region 数据访问（通过dataManager提供给UI层）

  /**
   * 获取当前地图的统计信息
   */
  @computed
  get currentStats(): EntityInfoStats[] {
    return this.dataManager.currentStats;
  }

  /**
   * 获取按分类分组的统计信息
   */
  @computed
  get currentCategorizedStats(): Record<string, EntityInfoStats[]> {
    return groupBy(this.currentStats, 'category');
  }

  /**
   * 获取数据管理器（供UI层使用）
   */
  public getDataManager(): EntityMapDataManager {
    return this.dataManager;
  }

  /**
   * 获取指定entityDataIdKey的组管理器
   */
  public getGroupManager(entityDataIdKey: string): EntityGroupManager | undefined {
    return this.dataManager.currentGroupManagers.find((m) => m.entityDataIdKey === entityDataIdKey);
  }

  // #endregion

  // #region 数据导入导出
  /**
   * 导入可见性数据
   */
  public async importVisibility(data: StorageData<EntityVisibility>): Promise<number> {
    this.pendingVisibility = data;
    // 转换为data manager期望的类型
    const fullData: Record<MapIndex, Record<string, boolean>> = {} as Record<MapIndex, Record<string, boolean>>;
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        fullData[key as MapIndex] = value;
      }
    }
    return this.dataManager.importVisibilityData(fullData);
  }

  /**
   * 导入标记数据
   */
  public async importMarked(data: StorageData<FeatureMarked>): Promise<number> {
    this.pendingMarked = data;
    // 转换为data manager期望的类型
    const fullData: Record<MapIndex, Record<number, boolean>> = {} as Record<MapIndex, Record<number, boolean>>;
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        fullData[key as MapIndex] = value;
      }
    }
    return this.dataManager.importMarkedData(fullData);
  }

  /**
   * 清除所有标记
   */
  public clearAllMarked(): void {
    this.dataManager.clearAllMarked();
  }

  /**
   * 重置所有可见性
   */
  public resetAllVisibility(visible: boolean = false): void {
    this.dataManager.resetAllVisibility(visible);
  }

  // #endregion

  /**
   * 销毁控制器
   */
  public dispose(): void {
    // 清理所有渲染器
    for (const [, rendererMap] of this.rendererCache) {
      for (const [, renderer] of rendererMap) {
        renderer.dispose();
      }
    }
    this.rendererCache.clear();

    // 清理disposers
    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers = [];
  }
}
