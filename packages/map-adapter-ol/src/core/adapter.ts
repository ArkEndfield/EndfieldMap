import { AreaNameController } from '@endfieldmap/map-adapter-ol/controller/core/area_name';
import { EndfieldMapLayerController } from '@endfieldmap/map-adapter-ol/controller/core/layer';
import { MapController } from '@endfieldmap/map-adapter-ol/controller/core/map';
import { ZoomController } from '@endfieldmap/map-adapter-ol/controller/core/zoom';
import { DevToolsController } from '@endfieldmap/map-adapter-ol/controller/dev_tools';
import { CustomPointController } from '@endfieldmap/map-adapter-ol/controller/entity/custom_point_controller';
import { ElectricPoleController } from '@endfieldmap/map-adapter-ol/controller/entity/electric_pole_controller';
import { EntityController } from '@endfieldmap/map-adapter-ol/controller/entity/entity_controller';
import { ActiveFeatureController } from '@endfieldmap/map-adapter-ol/controller/feature/active_feature';
import {
  ElectricPoleDragController,
  InitPoleDragOptions,
} from '@endfieldmap/map-adapter-ol/controller/feature/electric_pole_drag';
import { HoverConnectionController } from '@endfieldmap/map-adapter-ol/controller/feature/hover_connection';
import { HoverFeatureController } from '@endfieldmap/map-adapter-ol/controller/feature/hover_feature';
import { EventController } from '@endfieldmap/map-adapter-ol/controller/interaction/event';
import { KeyboardMoveController } from '@endfieldmap/map-adapter-ol/controller/interaction/keyboard';
import { PopupController } from '@endfieldmap/map-adapter-ol/controller/interaction/popup';
import { TierController } from '@endfieldmap/map-adapter-ol/controller/tier';
import { EntityTypeRegistry } from '@endfieldmap/map-adapter-ol/core/entity_registry';
import { EndfieldMapEvent } from '@endfieldmap/map-adapter-ol/event/map';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type {
  ElectricPoleDataInstance,
  EndfieldMapAssetConfig,
  EntityDataInstance,
  MapData,
  MapDataJson,
  SimpleMapConfig,
} from '@endfieldmap/map-core';
import { EndfieldMapAsset, EndfieldMapEmitter, EntityInstanceKey, LayerType, MAP_EVENT } from '@endfieldmap/map-core';
import type { LoggerReporter } from '@endfieldmap/tools';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

export interface AdapterConfig {
  data: MapDataJson;
  container: HTMLElement;
  asset: EndfieldMapAssetConfig;
  map?: SimpleMapConfig;
  consolaReporter?: LoggerReporter;
  popup?: {
    enabled?: boolean;
  };
  /** 是否为开发模式（启用 DevTools） */
  isDev?: boolean;
}

export class EndfieldMapAdapter {
  /** 容器 */
  /** 容器 */
  public container!: HTMLElement;
  /** 静态资源管理器 */
  public asset!: EndfieldMapAsset;
  /** 地图控制器 */
  public mapController!: MapController;
  /** 图层管理器 */
  public layerController!: EndfieldMapLayerController;
  /** 事件管理器 */
  public eventManager!: EndfieldMapEvent;
  /** 区域名称控制器 */
  public areaNameController!: AreaNameController;
  /** 实体数据管理器 */
  public entityController!: EntityController;
  /** 电线杆数据管理器 */
  public electricPoleController!: ElectricPoleController;
  public customPointController!: CustomPointController;
  public tierController!: TierController;
  public eventController!: EventController;
  /** 激活特征控制器 */
  public activeFeatureController!: ActiveFeatureController;
  /** Hover特征控制器 */
  public hoverFeatureController!: HoverFeatureController;
  /** Hover连接控制器 */
  public hoverConnectionController!: HoverConnectionController;
  /** 电线杆拖拽控制器 */
  public electricPoleDragController!: ElectricPoleDragController;
  /** Popup控制器 */
  public popupController: PopupController | null = null;
  /** 缩放控制器 */
  public zoomController: ZoomController | null = null;
  /** 快捷键控制器 */
  public keyboardMoveController: KeyboardMoveController | null = null;
  /** DevTools 控制器（仅开发模式） */
  public devToolsController: DevToolsController | null = null;
  /** 实体类型注册表（统一管理实体类型的搜索、可见性等） */
  public entityRegistry!: EntityTypeRegistry;
  /** 事件 */
  public event!: EndfieldMapEmitter<OLMapEventPayloads>;
  /** 是否开启hover效果 */
  @observable accessor enableHover: boolean = true;
  /** hover debounce time */
  @observable accessor hoverDebounceTime: number = 0;
  /** 批量选中更新定时器 */
  private selectionUpdateTimer: number | null = null;

  constructor(config: AdapterConfig) {
    this.initCore(config);
    this.initEntitySystem();
    this.initEntityRegistry();
    this.initInteraction(config);
    this.initUI(config);
    this.initSelectionHandler();
  }

  // #region 初始化阶段

  /** 阶段 1：核心基础设施（日志、事件总线、地图引擎） */
  private initCore(config: AdapterConfig): void {
    if (config.consolaReporter) {
      logger.addReporter(config.consolaReporter);
    }
    const mapConfig: SimpleMapConfig = {
      ...(config.map || {}),
    };
    this.event = new EndfieldMapEmitter<OLMapEventPayloads>();
    this.container = config.container;
    this.asset = new EndfieldMapAsset(config.asset);
    this.mapController = new MapController({
      data: config.data,
      mapConfig: {
        container: this.container,
        ...mapConfig,
      },
      asset: this.asset,
      emitter: this.event,
    });

    const mapDataManager = this.mapController.dataManager;
    const mapInstance = this.mapController.olMapRenderer;

    this.eventManager = new EndfieldMapEvent(mapInstance, this.event);
    this.layerController = new EndfieldMapLayerController(mapInstance);
    this.areaNameController = new AreaNameController({ mapDataManager, emitter: this.event });
  }

  /** 阶段 2：实体系统（Entity / ElectricPole / CustomPoint / Tier 控制器） */
  private initEntitySystem(): void {
    const mapDataManager = this.mapController.dataManager;
    const mapInstance = this.mapController.olMapRenderer;

    // Tier 先于 Entity 创建：EntityController 依赖 tierDataManager 计算分层角标
    this.tierController = new TierController({
      mapDataManager,
      mapInstance,
    });
    this.entityController = new EntityController({
      mapDataManager,
      mapInstance,
      asset: this.asset,
      emitter: this.event,
      tierDataManager: this.tierController.tierDataManager,
    });
    this.electricPoleController = new ElectricPoleController({
      mapDataManager,
      mapInstance,
      asset: this.asset,
    });
    this.customPointController = new CustomPointController({
      mapDataManager,
      mapInstance,
      asset: this.asset,
    });
  }

  /** 阶段 3：实体类型注册表（可扩展的搜索 / 可见性 / hit test 分发） */
  private initEntityRegistry(): void {
    this.entityRegistry = new EntityTypeRegistry();
    this.entityRegistry.register({
      matchesInstance: (instance) => instance.entityType !== '#ElectricPole' && instance.entityType !== '#CustomPoint',
      searchById: (mapId, id) => this.entityController.getInstanceById(mapId, id),
      getHitTestLayers: () => this.entityController?.render.currentRenderer || [],
      clustered: true,
      isGroupVisible: (instance) => {
        const managers = this.entityController.dataManager.mapData.get(instance.mapId);
        const groupManager = managers?.get(instance.entityDataIdKey);
        return groupManager?.groupVisible ?? true;
      },
    });
    this.entityRegistry.register({
      matchesInstance: (instance) => instance.entityType === '#ElectricPole',
      searchById: (mapId, id) => this.electricPoleController.dataManager.getMapManager(mapId).getById(id),
      getHitTestLayers: () => this.electricPoleController?.render.currentPoleRenderers || [],
      clustered: false,
      isGroupVisible: () => this.electricPoleController.dataManager.visible,
    });
    this.entityRegistry.register({
      matchesInstance: (instance) => instance.entityType === '#CustomPoint',
      searchById: (mapId, id) => this.customPointController.dataManager.getMapManager(mapId).getById(id),
      getHitTestLayers: () => this.customPointController?.currentRenderer || [],
      clustered: false,
      isGroupVisible: (instance) => this.customPointController.getTypeVisible(instance.entityDataIdKey),
    });
  }

  /** 阶段 4：交互控制器（Active / Hover / Selection / Event） */
  private initInteraction(config: AdapterConfig): void {
    const mapInstance = this.mapController.olMapRenderer;

    this.activeFeatureController = new ActiveFeatureController({
      disableActiveFeature: config.map?.disableActiveFeature,
      mapInstance,
      emitter: this.event,
      isGroupVisible: (instance) => this.entityRegistry.isGroupVisible(instance),
    });
    this.hoverFeatureController = new HoverFeatureController({
      checkIsActive: (instance) => this.activeFeatureController.activeFeature === instance,
      disableHoverFeature: config.map?.disableHoverFeature,
      mapInstance,
      emitter: this.event,
    });
    this.hoverConnectionController = new HoverConnectionController({
      disableHoverConnection: config.map?.disableHoverFeature,
      emitter: this.event,
    });
    this.electricPoleDragController = new ElectricPoleDragController({
      mapInstance,
      electricPoleController: this.electricPoleController,
      getCurrentMapId: () => this.mapController.dataManager.currentMapId,
      hoverFeatureController: this.hoverFeatureController,
      emitter: this.event,
    });
    this.eventController = new EventController({
      getClusteredLayers: () => this.entityRegistry.getClusteredLayers(),
      getNonClusteredLayers: () => this.entityRegistry.getNonClusteredLayers(),
      getConnectionRenderers: () => this.electricPoleController?.render.currentPoleRenderers || [],
      disableHover: config.map?.disableHoverFeature,
      emitter: this.event,
      getEntityClickSuppress: () => this.electricPoleDragController.getLastDraggedPoleInstance(),
      onEntityClickSuppressed: () => this.electricPoleDragController.clearLastDraggedPoleInstance(),
    });

    // 电线杆 hover 时高亮其关联连线与 zone
    this.event.on(MAP_EVENT.HOVER_FEATURE_CHANGE, ({ newFeature }) => {
      if (newFeature?.entityType === '#ElectricPole') {
        this.electricPoleController.setHoveredPole(newFeature as ElectricPoleDataInstance);
      } else {
        this.electricPoleController.setHoveredPole(null);
      }
    });
  }

  /** 阶段 5：UI 控件（Popup / Zoom / 图层注册 / 快捷键 / DevTools） */
  private initUI(config: AdapterConfig): void {
    const mapInstance = this.mapController.olMapRenderer;

    if (config.popup?.enabled !== false) {
      this.popupController = new PopupController(mapInstance, this.event);
    }

    this.zoomController = new ZoomController(this.event);
    this.mapController.olMapRenderer.map.addControl(this.zoomController);

    this.layerController.addLayer(LayerType.AREA_NAME, this.areaNameController.areaNameLayer);
    this.layerController.addLayer(LayerType.TIER_OVERLAY_MASK, this.tierController.tierOverlayMaskLayer);
    this.layerController.addLayer(LayerType.TIER, this.tierController.tierLayer);

    this.keyboardMoveController = new KeyboardMoveController({
      speed: 0.5,
      mapInstance,
    });

    if (config.isDev) {
      this.devToolsController = new DevToolsController({ mapInstance });
    }
  }

  /** 阶段 6：Selection 回调（通过 Controller 批量更新 selected 状态） */
  private initSelectionHandler(): void {
    const mapInstance = this.mapController.olMapRenderer;
    const pendingUpdates = new Map<string, { mapId: MapData['id']; levelLogicId: number; selected: boolean }>();

    mapInstance.selection.setOnSelectionChange((feature, selected) => {
      const dataInstance = feature.get(EntityInstanceKey) as EntityDataInstance | undefined;
      if (!dataInstance) return;

      if (dataInstance.selected === selected) return;

      const mapId = this.mapController.dataManager.currentMapId;
      const levelLogicId = dataInstance.id;
      const key = `${mapId}-${levelLogicId}`;

      pendingUpdates.set(key, { mapId, levelLogicId, selected });

      if (!this.selectionUpdateTimer) {
        this.selectionUpdateTimer = requestAnimationFrame(() => {
          if (pendingUpdates.size > 0) {
            this.entityController.batchSetSelected(Array.from(pendingUpdates.values()));
            pendingUpdates.clear();
          }
          this.selectionUpdateTimer = null;
        });
      }
    });
  }

  // #endregion

  /**
   * 渲染地图
   * @param mapId 地图id
   */
  @action
  public renderMap(mapId: MapData['id']) {
    // this.mapLayerController.renderMap(mapId);
    this.mapController.renderMap(mapId);
    this.activeFeatureController.clearActiveFeature();
    this.mapController.selection.stopSelecting();
    this.tierController.clearTier();
  }

  /**
   * 设置区域名称
   * @param zoom 缩放
   */
  public renderAreaName(zoom?: number) {
    const currentZoom = zoom ?? this.mapController.olMapRenderer.view.getZoom();
    return this.areaNameController.setAreaName(currentZoom);
  }

  /**
   * 设置是否启用active feature
   * @param enable 是否启用
   */
  public setActiveFeatureEnable(enable: boolean) {
    this.activeFeatureController.setEnable(enable);
  }

  /**
   * 设置是否启用hover feature
   * @param enable 是否启用
   */
  @action
  public setHoverFeatureEnable(enable: boolean) {
    this.enableHover = enable;
    this.eventController.setHoverEnable(enable);
    this.hoverFeatureController.setEnable(enable);
    this.hoverConnectionController.setEnable(enable);
  }

  /**
   * 设置 hover debounce time
   * @param time debounce time
   */
  @action
  public setHoverDebounceTime(time: number) {
    this.hoverDebounceTime = time;
    this.eventController.setHoverDebounceTime(time);
  }

  /**
   * 初始化电线杆拖拽：注入 canDragPole 与 onEnd，不依赖激活标点；hover 到杆上 pointerdown 即开始拖拽。
   */
  public initPoleDrag(options: InitPoleDragOptions): void {
    this.electricPoleDragController.initPoleDrag(options);
  }

  /**
   * 拖拽结束后若 move 校验失败，由 Web 调用以回滚杆位置。
   */
  public revertPoleDrag(): void {
    this.electricPoleDragController.revertPoleDrag();
  }

  /** 是否正在拖拽电线杆（用于拖拽期间抑制 hover 更新） */
  public isPoleDragging(): boolean {
    return this.electricPoleDragController.isPoleDragging();
  }

  /**
   * 设置是否启用聚合标点
   * @param enable 是否启用聚合
   */
  public setClusterEnable(enable: boolean) {
    this.entityController.setClusterEnable(enable);
  }

  /**
   * 销毁适配器，清理所有资源
   */
  public dispose(): void {
    // 取消待处理的批量选中更新
    if (this.selectionUpdateTimer) {
      cancelAnimationFrame(this.selectionUpdateTimer);
      this.selectionUpdateTimer = null;
    }

    // 清理 feature 控制器
    this.activeFeatureController.dispose();
    this.hoverFeatureController.dispose();
    this.hoverConnectionController.dispose();
    this.electricPoleDragController.dispose();

    // 清理实体控制器（继承自 Disposer，含 reaction 等）
    this.entityController.dispose();
    this.electricPoleController.dispose();
    this.customPointController.dispose();

    // 清理其他控制器
    this.areaNameController.dispose();
    this.tierController.dispose();
    this.popupController?.dispose();
    this.keyboardMoveController?.dispose();

    // 取消注册缩放控件
    if (this.zoomController) {
      this.mapController.olMapRenderer.map.removeControl(this.zoomController);
      this.zoomController.dispose();
    }

    // 清理 DevTools 控制器
    if (this.devToolsController) {
      this.devToolsController.dispose();
    }

    // 清理事件控制器
    this.eventController.dispose();

    // 清理 DOM 事件监听器
    this.eventManager.dispose();

    // 清理事件
    this.event.removeAllListeners();

    // 清理选择交互（在地图控制器之前，因为依赖地图实例）
    this.mapController.selection.destroy();

    // 清理地图控制器（最后清理，因为其他控制器可能依赖地图实例）
    this.mapController.dispose();
  }
}
