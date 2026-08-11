import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import { EntityRender } from '@endfieldmap/map-adapter-ol/render/renderer/entity/common/entity';
import type { FeatureData } from '@endfieldmap/map-adapter-ol/render/renderer/entity/common/entity_group_renderer';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type {
  EndfieldMapAsset,
  EndfieldMapEmitter,
  EntityData,
  EntityDataInstance,
  EntityGroupManager,
  EntityInfoDataJson,
  EntityInfoStats,
  EntityJsonDataList,
  MapData,MapDataManager,
  TierDataManager
} from '@endfieldmap/map-core';
import { Disposer, EntityInstanceKey, EntityMapDataManager,MAP_EVENT, MarkedFeatureFilterMode, TierBadgeState } from '@endfieldmap/map-core';
import { action, reaction } from 'mobx';

export interface EntityControllerConfig {
  mapDataManager: MapDataManager;
  mapInstance: EndfieldMap;
  asset: EndfieldMapAsset;
  emitter: EndfieldMapEmitter<OLMapEventPayloads>;
  tierDataManager: TierDataManager;
}

/**
 * Entity控制器
 * 负责协调 EntityDataManager 和 EntityRender
 * 提供给UI层访问数据的接口
 *
 * 设计原则：
 * - 是数据变更和渲染更新的唯一入口
 * - 外部不直接访问 dataManager，通过 controller 代理
 * - 数据变更后显式调用 render 方法同步渲染
 */
export class EntityController extends Disposer {
  /** 数据管理器（内部使用） */
  public readonly dataManager: EntityMapDataManager;

  /** 当前缩放级别 */
  private currentZoom: number = 3;

  /** 渲染管理器 */
  public render: EntityRender;

  private mapDataManager: MapDataManager;

  private emitter: EndfieldMapEmitter<OLMapEventPayloads>;

  private asset: EndfieldMapAsset;

  private tierDataManager: TierDataManager;

  /** 分层角标总开关（跟随 Web 侧分层功能开关） */
  private tierBadgeEnabled: boolean = true;

  constructor(config: EntityControllerConfig) {
    super();
    this.mapDataManager = config.mapDataManager;
    this.emitter = config.emitter;
    this.asset = config.asset;
    this.tierDataManager = config.tierDataManager;
    this.dataManager = new EntityMapDataManager(config.mapDataManager);
    this.render = new EntityRender({
      mapInstance: config.mapInstance,
      mapIds: [], // 初始为空，loadData 后填充
    });

    this.registerEventHandlers();
  }

  // #region 数据代理（供 map-web UI 使用）

  /**
   * 获取当前地图的统计信息
   */
  get currentStats(): EntityInfoStats[] {
    return this.dataManager.currentStats;
  }

  /**
   * 获取地图的组管理器列表
   */
  public getMapGroupManagerList(mapId: MapData['id']): EntityGroupManager[] {
    return this.dataManager.getMapGroupManagerList(mapId);
  }

  /**
   * 通过ID获取数据实例
   */
  getInstanceById(mapId: MapData['id'], id: number): EntityDataInstance | undefined {
    return this.dataManager.getInstanceById(mapId, id);
  }

  public getMapLevelIds(mapId: MapData['id']): string[] {
    return this.dataManager.getMapLevelIds(mapId);
  }

  public getSelectedLevelIds(mapId: MapData['id']): string[] {
    return [...this.dataManager.getSelectedLevelIds(mapId)];
  }

  // #endregion

  // #region 事件处理

  /**
   * 注册事件处理器
   */
  private registerEventHandlers(): void {
    // 监听缩放变化
    this.emitter.on(MAP_EVENT.ZOOM_CHANGE, (zoom) => {
      this.currentZoom = zoom;
      this.updateClusterDistance();
    });

    // 监听地图切换
    this.disposers.push(
      reaction(
        () => this.mapDataManager.currentMapId,
        async () => {
          if (!this.dataManager.dataLoaded) {
            return;
          }
          // 切换当前地图的渲染
          this.render.switchMap(this.mapDataManager.currentMapId);

          // 应用 marked 过滤模式
          this.applyMarkedFilterMode();

          // 刷新分层角标（切图后分层必然被清空，需要复位角标状态）
          this.applyTierBadges();

          // 更新聚合距离
          this.updateClusterDistance(true);
        },
        { fireImmediately: true }
      )
    );

    // 分层激活状态变化时，刷新标点的分层角标
    this.disposers.push(
      reaction(
        () => [this.tierDataManager.activeTier, this.tierDataManager.activeSubTier],
        () => {
          if (!this.dataManager.dataLoaded) {
            return;
          }
          this.applyTierBadges();
        }
      )
    );
  }

  // #endregion

  // #region 数据加载

  /**
   * 加载数据并初始化渲染器
   */
  public loadData(jsonData: EntityJsonDataList, infoData: EntityInfoDataJson) {
    this.dataManager.loadData(jsonData, infoData);

    // 为每个地图的每个组创建渲染器并填充 features
    this.initializeRenderers();

    // 切换到当前地图
    this.render.switchMap(this.mapDataManager.currentMapId);
    this.applyMarkedFilterMode();
    this.applyTierBadges();
    this.updateClusterDistance(true);
  }

  /**
   * 初始化所有渲染器
   * 根据 dataManager 中的数据，为每个地图的每个组创建渲染器
   */
  private initializeRenderers(): void {
    const imagePath = this.asset.entityImage;

    // 获取所有地图ID
    const mapIds = Array.from(this.dataManager.mapData.keys());

    // 重建 render（包含所有 mapIds）
    this.render = new EntityRender({
      mapInstance: this.render['mapInstance'], // 复用 mapInstance
      mapIds,
    });

    for (const mapId of mapIds) {
      const groupManagers = this.dataManager.getMapGroupManagerList(mapId);

      for (const manager of groupManagers) {
        // 创建渲染器
        const renderer = this.render.createGroupRenderer(mapId, manager.entityDataIdKey, {
          iconPath: `${imagePath}/${manager.iconName}.png`,
          enableCluster: !this.dataManager.disableCluster,
          clusterDistance: this.dataManager.clusterDistance,
          initialVisible: manager.groupVisible,
          enableShadow: false,
        });

        // 生成 FeatureData 并批量添加
        const featureDataList: FeatureData[] = manager.instances.map((instance) => ({
          id: instance.id,
          coordinates: instance.coordinates,
          dataInstance: instance,
          visible: this.isFeatureRenderable(instance),
          marked: instance.marked,
          selected: instance.selected,
          active: instance.active,
        }));

        renderer.addFeatures(featureDataList);
      }
    }
  }

  // #endregion

  // #region 聚合控制

  /**
   * 是否应该启用聚合
   */
  private shouldCluster(zoom: number): boolean {
    return !this.dataManager.disableCluster && zoom < 4;
  }

  /**
   * 更新聚合距离
   */
  private updateClusterDistance(force: boolean = false): void {
    const shouldCluster = this.shouldCluster(this.currentZoom);
    const newDistance = shouldCluster ? this.dataManager.clusterDistance : 0;

    if (force || newDistance !== this.dataManager.lastClusterDistance) {
      this.dataManager.lastClusterDistance = newDistance;
      this.render.setClusterDistance(this.mapDataManager.currentMapId, newDistance);
    }
  }

  /**
   * 设置是否启用聚合
   */
  public setClusterEnable(enable: boolean): void {
    const newDisableCluster = !enable;
    if (this.dataManager.disableCluster === newDisableCluster) {
      return;
    }
    this.dataManager.setDisableCluster(newDisableCluster);
    this.updateClusterDistance();
  }

  // #endregion

  // #region 状态变更（数据 + 渲染同步）

  /**
   * 根据 markedFilterMode 判断 feature 是否可见
   */
  private isFeatureVisibleByFilter(marked: boolean, mode: MarkedFeatureFilterMode): boolean {
    switch (mode) {
      case MarkedFeatureFilterMode.Marked:
        return marked;
      case MarkedFeatureFilterMode.Unmarked:
        return !marked;
      case MarkedFeatureFilterMode.All:
      default:
        return true;
    }
  }

  private isFeatureRenderable(instance: EntityDataInstance): boolean {
    return (
      instance.visible &&
      this.isFeatureVisibleByFilter(instance.marked, this.dataManager.markedFilterMode) &&
      // 用 mapLevelId 而非 data.mapLevelId：后者会 toJS 深拷贝整个实体数据，
      // 而这里是逐实体跑满全图的热路径
      this.dataManager.isLevelSelected(instance.mapId, instance.mapLevelId)
    );
  }

  /**
   * 应用 marked 过滤模式到当前地图的所有渲染器
   * 通过设置每个 feature 的 visible 属性来控制显隐
   */
  private applyMarkedFilterMode(): void {
    const currentMapId = this.mapDataManager.currentMapId;
    const mode = this.dataManager.markedFilterMode;
    const renderers = this.render.getRenderers(currentMapId);

    for (const renderer of renderers) {
      renderer.updateAllFeaturesState((_id, feature) => {
        const instance = feature.get(EntityInstanceKey) as EntityDataInstance | undefined;
        if (!instance) {
          const marked = feature.get('marked') === 1;
          return { visible: this.isFeatureVisibleByFilter(marked, mode) };
        }
        return { visible: this.isFeatureRenderable(instance) };
      });
      renderer.refreshAllClusterProps();
    }
  }

  private applyLevelFilter(mapId: MapData['id']): void {
    const renderers = this.render.getRenderers(mapId);
    for (const renderer of renderers) {
      renderer.updateAllFeaturesState((_id, feature) => {
        const instance = feature.get(EntityInstanceKey) as EntityDataInstance | undefined;
        if (!instance) return {};
        return { visible: this.isFeatureRenderable(instance) };
      });
      renderer.refreshAllClusterProps();
    }
  }

  @action
  public setSelectedLevels(mapId: MapData['id'], levelIds: string[]): void {
    this.dataManager.setSelectedLevels(mapId, levelIds);
    this.applyLevelFilter(mapId);
  }

  @action
  public setLevelSelected(mapId: MapData['id'], levelId: string, selected: boolean): void {
    this.dataManager.setLevelSelected(mapId, levelId, selected);
    this.applyLevelFilter(mapId);
  }

  @action
  public resetSelectedLevels(mapId: MapData['id']): void {
    this.dataManager.resetSelectedLevels(mapId);
    this.applyLevelFilter(mapId);
  }

  /**
   * 设置 Marked 状态
   * 同时更新数据和渲染（包括 visible，因为 markedFilterMode 可能影响可见性）
   */
  public setMarked(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], marked: boolean): void {
    this.dataManager.setMarked(mapId, levelLogicId, marked);

    // 同步渲染
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (instance) {
      this.render.updateFeatureState(mapId, instance.id, {
        marked: instance.marked,
        visible: this.isFeatureRenderable(instance),
      });
    }
  }

  /**
   * 设置实体可见性
   * 同时更新数据和渲染
   */
  public setEntityVisibility(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], visible: boolean): void {
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (!instance) return;
    instance.setVisible(visible);
    this.render.updateFeatureState(mapId, instance.id, {
      visible: this.isFeatureRenderable(instance),
    });
  }

  /**
   * 设置所有实体可见性
   * 同时更新数据和渲染
   */
  public setAllEntityVisible(visible: boolean): void {
    const allRenderers = this.render.allRenderers;
    // 设置 data 和 renderer 的 visible
    for (const renderer of allRenderers) {
      renderer.updateAllFeaturesState((_id, feature) => {
        const instance = feature.get(EntityInstanceKey);
        if (!instance) return { visible };
        instance.setVisible(visible);
        return { visible: this.isFeatureRenderable(instance) };
      });
      renderer.refreshAllClusterProps();
    }
  }

  /**
   * 设置实体组可见性
   * 同时更新数据和渲染
   */
  public setGroupVisibility(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean): void {
    this.dataManager.setGroupVisibility(mapId, entityKey, visible);

    // 同步渲染
    this.render.setGroupVisible(mapId, entityKey, visible);
  }

  /**
   * 刷新当前地图所有标点的分层角标状态
   *
   * 角标语义：标点所属的 Tier 分层不是当前视图层级时显示三角箭头，
   * 方向由标点自身高度与当前激活分层的实体平均高度比较得出；
   * 未打开分层时，处于分层内的标点统一显示向下箭头（表示需进入分层查看）。
   */
  public applyTierBadges(): void {
    const tierDataManager = this.tierDataManager;
    const activeTier = tierDataManager.activeTier;
    const activeSubTier = tierDataManager.activeSubTier;
    const activeRegionId = tierDataManager.currentActiveTier?.data.regionId;
    const activeMeanY = activeRegionId === undefined ? undefined : this.dataManager.regionMeanY.get(activeRegionId);
    const enabled = this.tierBadgeEnabled;

    const renderers = this.render.getRenderers(this.mapDataManager.currentMapId);
    for (const renderer of renderers) {
      renderer.updateAllFeaturesState((_id, feature) => {
        if (!enabled) {
          return { tierBadge: TierBadgeState.None };
        }
        const instance = feature.get(EntityInstanceKey) as EntityDataInstance | undefined;
        if (!instance) {
          return {};
        }
        const region = tierDataManager.getTierRegion(instance.mapRegionId);
        if (!region || (region.tierId === activeTier && region.subTierId === activeSubTier)) {
          return { tierBadge: TierBadgeState.None };
        }
        if (activeMeanY === undefined) {
          return { tierBadge: TierBadgeState.Down };
        }
        return { tierBadge: instance.positionY > activeMeanY ? TierBadgeState.Up : TierBadgeState.Down };
      });
      renderer.refreshAllClusterProps();
    }
  }

  /**
   * 设置分层角标总开关（Web 侧分层功能关闭时同步关闭角标）
   */
  public setTierBadgeEnabled(enabled: boolean): void {
    if (this.tierBadgeEnabled === enabled) {
      return;
    }
    this.tierBadgeEnabled = enabled;
    if (this.dataManager.dataLoaded) {
      this.applyTierBadges();
    }
  }

  /**
   * 设置 marked 过滤模式
   * 同时更新数据和渲染
   */
  @action
  public setMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    if (this.dataManager.markedFilterMode === mode) {
      return;
    }
    this.dataManager.setMarkedFilterMode(mode);
    this.applyMarkedFilterMode();
  }

  /**
   * 设置 Selected 状态
   * 同时更新数据和渲染
   */
  public setSelected(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], selected: boolean): void {
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (instance) {
      instance.setSelected(selected);
      // 同步渲染
      this.render.updateFeatureState(mapId, instance.id, {
        selected: instance.selected,
      });
    }
  }

  /**
   * 批量设置 Selected 状态
   * 用于选择交互，可以更高效地批量更新
   */
  public batchSetSelected(
    items: Array<{ mapId: MapData['id']; levelLogicId: EntityData['levelLogicId']; selected: boolean }>
  ): void {
    // 按 mapId 分组
    const groupedByMap = new Map<MapData['id'], Array<{ id: number; selected: boolean }>>();

    for (const item of items) {
      const instance = this.dataManager.getInstanceById(item.mapId, item.levelLogicId);
      if (!instance) continue;

      // 状态没变化，跳过
      if (instance.selected === item.selected) continue;

      // 更新数据
      instance.setSelected(item.selected);

      // 收集渲染更新信息
      if (!groupedByMap.has(item.mapId)) {
        groupedByMap.set(item.mapId, []);
      }
      groupedByMap.get(item.mapId)!.push({
        id: instance.id,
        selected: instance.selected,
      });
    }

    // 批量同步渲染（每个地图只刷新一次）
    for (const [mapId, updates] of groupedByMap) {
      const renderers = this.render.getRenderers(mapId);
      for (const renderer of renderers) {
        // 更新所有 features
        for (const update of updates) {
          renderer.updateFeatureState(update.id, { selected: update.selected });
        }
        // 批量更新后一次性刷新聚合属性
        renderer.refreshAllClusterProps();
      }
    }
  }

  /**
   * 设置 Active 状态
   * 同时更新数据和渲染
   */
  public setActive(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], active: boolean): void {
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (instance) {
      instance.setActive(active);
      // 同步渲染
      this.render.updateFeatureState(mapId, instance.id, {
        active: instance.active,
      });
    }
  }

  // #endregion

  // #region 数据导入导出

  /**
   * 导入可见性数据
   */
  public async importVisibility(
    data: {
      entityKey: EntityData['entityDataIdKey'];
      mapId: MapData['id'];
      visible: boolean;
    }[]
  ): Promise<number> {
    let count = 0;
    for (const item of data) {
      this.setGroupVisibility(item.mapId, item.entityKey, item.visible);
      count++;
    }
    return count;
  }

  /**
   * 导入 marked 数据
   */
  public async importMarked(
    data: {
      entityId: EntityData['levelLogicId'];
      mapId: MapData['id'];
      marked: boolean;
    }[]
  ): Promise<number> {
    let count = 0;
    for (const item of data) {
      this.setMarked(item.mapId, item.entityId, item.marked);
      if (item.marked) {
        count++;
      }
    }
    return count;
  }

  // #endregion
}
