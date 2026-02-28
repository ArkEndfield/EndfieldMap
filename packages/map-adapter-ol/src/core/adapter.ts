import { AreaNameController } from '@endfieldmap/map-adapter-ol/controller/core/area_name';
import { EndfieldMapLayerController } from '@endfieldmap/map-adapter-ol/controller/core/layer';
import { MapController } from '@endfieldmap/map-adapter-ol/controller/core/map';
import { ZoomController } from '@endfieldmap/map-adapter-ol/controller/core/zoom';
import { DevToolsController } from '@endfieldmap/map-adapter-ol/controller/dev_tools';
import { CustomPointController } from '@endfieldmap/map-adapter-ol/controller/entity/custom_point_controller';
import { ElectricPoleController } from '@endfieldmap/map-adapter-ol/controller/entity/electric_pole_controller';
import { EntityController } from '@endfieldmap/map-adapter-ol/controller/entity/entity_controller';
import { ActiveFeatureController } from '@endfieldmap/map-adapter-ol/controller/feature/active_feature';
import { HoverConnectionController } from '@endfieldmap/map-adapter-ol/controller/feature/hover_connection';
import { HoverFeatureController } from '@endfieldmap/map-adapter-ol/controller/feature/hover_feature';
import { EventController } from '@endfieldmap/map-adapter-ol/controller/interaction/event';
import { KeyboardMoveController } from '@endfieldmap/map-adapter-ol/controller/interaction/keyboard';
import { PopupController } from '@endfieldmap/map-adapter-ol/controller/interaction/popup';
import { TierController } from '@endfieldmap/map-adapter-ol/controller/tier';
import { EntityTypeRegistry } from '@endfieldmap/map-adapter-ol/core/entity_registry';
import { EndfieldMapEvent } from '@endfieldmap/map-adapter-ol/event/map';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { CustomPointDataInstance, ElectricPoleDataInstance, EndfieldMapAssetConfig, EntityDataInstance, MapData, MapDataJson, SimpleMapConfig } from '@endfieldmap/map-core';
import { EndfieldMapAsset, EndfieldMapEmitter, EntityInstanceKey, LayerType } from '@endfieldmap/map-core';
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
  public container: HTMLElement;
  /** 静态资源管理器 */
  public asset: EndfieldMapAsset;
  /** 地图控制器 */
  public mapController: MapController;
  /** 图层管理器 */
  public layerController: EndfieldMapLayerController;
  /** 事件管理器 */
  public eventManager: EndfieldMapEvent;
  /** 区域名称控制器 */
  public areaNameController: AreaNameController;
  /** 地图图层控制器 */
  // public mapLayerController: MapLayerController;
  /** 实体数据管理器 */
  public entityController: EntityController;
  /** 电线杆数据管理器 */
  public electricPoleController: ElectricPoleController;
  public customPointController: CustomPointController;
  public tierController: TierController;
  public eventController: EventController;
  /** 激活特征控制器 */
  public activeFeatureController: ActiveFeatureController;
  /** Hover特征控制器 */
  public hoverFeatureController: HoverFeatureController;
  /** Hover连接控制器 */
  public hoverConnectionController: HoverConnectionController;
  /** 数据控制器 */
  // public dataController: DataController;
  /** Popup控制器 */
  public popupController: PopupController | null = null;
  /** 缩放控制器 */
  public zoomController: ZoomController | null = null;
  /** 快捷键控制器 */
  public keyboardMoveController: KeyboardMoveController | null = null;
  /** DevTools 控制器（仅开发模式） */
  public devToolsController: DevToolsController | null = null;
  /** 实体类型注册表（统一管理实体类型的搜索、可见性等） */
  public entityRegistry: EntityTypeRegistry;
  /** 事件 */
  public event: EndfieldMapEmitter<OLMapEventPayloads>;
  /** 是否开启hover效果 */
  @observable accessor enableHover: boolean = true;
  /** hover debounce time */
  @observable accessor hoverDebounceTime: number = 0;
  /** 批量选中更新定时器 */
  private selectionUpdateTimer: number | null = null;

  constructor(config: AdapterConfig) {
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

    // 提取核心实例，方便后续传递
    const mapDataManager = this.mapController.dataManager;
    const mapInstance = this.mapController.olMapRenderer;

    this.eventManager = new EndfieldMapEvent(mapInstance, this.event);
    this.layerController = new EndfieldMapLayerController(mapInstance);
    this.areaNameController = new AreaNameController({ mapDataManager, emitter: this.event });
    this.entityController = new EntityController({
      mapDataManager,
      mapInstance,
      asset: this.asset,
      emitter: this.event,
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
    this.tierController = new TierController({
      mapDataManager,
      mapInstance,
    });

    // 初始化实体类型注册表
    this.entityRegistry = new EntityTypeRegistry();
    this.entityRegistry.register({
      matchesInstance: (instance) => instance.entityType !== '#ElectricPole' && instance.entityType !== '#CustomPoint',
      searchById: (mapId, id) => this.entityController.getInstanceById(mapId, id),
      toggleVisible: (instance) => {
        const entityInstance = instance as EntityDataInstance;
        this.entityController.setGroupVisibility(entityInstance.mapId, entityInstance.entityDataIdKey, true);
      },
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
      toggleVisible: () => {
        this.electricPoleController.setVisible(true);
        this.electricPoleController.setZoneVisible(true);
      },
      getHitTestLayers: () => this.electricPoleController?.render.currentPoleRenderers || [],
      clustered: false,
      isGroupVisible: () => this.electricPoleController.dataManager.visible,
    });
    this.entityRegistry.register({
      matchesInstance: (instance) => instance.entityType === '#CustomPoint',
      searchById: (mapId, id) => this.customPointController.dataManager.getMapManager(mapId).getById(id),
      toggleVisible: () => {
        this.customPointController.setCustomPointVisible(true);
      },
      getHitTestLayers: () => this.customPointController?.currentRenderer || [],
      clustered: false,
      isGroupVisible: (instance) => this.customPointController.getTypeVisible(instance.entityDataIdKey),
    });

    this.activeFeatureController = new ActiveFeatureController({
      disableActiveFeature: config.map?.disableActiveFeature,
      mapInstance,
      emitter: this.event,
      isGroupVisible: (instance) => this.entityRegistry.isGroupVisible(instance),
    });
    this.hoverFeatureController = new HoverFeatureController({
      getClusteredLayers: () => this.entityRegistry.getClusteredLayers(),
      getNonClusteredLayers: () => this.entityRegistry.getNonClusteredLayers(),
      checkIsActive: (instance) => this.activeFeatureController.activeFeature === instance,
      disableHoverFeature: config.map?.disableHoverFeature,
      mapInstance,
      emitter: this.event,
    });
    this.hoverConnectionController = new HoverConnectionController({
      getConnectionLayers: () => this.electricPoleController?.render.currentPoleRenderers || [],
      disableHoverConnection: config.map?.disableHoverFeature,
      emitter: this.event,
    });
    this.eventController = new EventController({
      getClusteredLayers: () => this.entityRegistry.getClusteredLayers(),
      getNonClusteredLayers: () => this.entityRegistry.getNonClusteredLayers(),
      getConnectionRenderers: () => this.electricPoleController?.render.currentPoleRenderers || [],
      emitter: this.event,
    });
    // 初始化popup控制器（默认启用）
    if (config.popup?.enabled !== false) {
      this.popupController = new PopupController(mapInstance, this.event);
    }

    // 初始化缩放控制器
    this.zoomController = new ZoomController(this.event);
    // 注册缩放控件到地图 TODO: 不知道后面可不可以去掉
    this.mapController.olMapRenderer.map.addControl(this.zoomController);

    this.layerController.addLayer(LayerType.AREA_NAME, this.areaNameController.areaNameLayer);
    this.layerController.addLayer(LayerType.TIER_OVERLAY_MASK, this.tierController.tierOverlayMaskLayer);
    this.layerController.addLayer(LayerType.TIER, this.tierController.tierLayer);

    this.keyboardMoveController = new KeyboardMoveController({
      speed: 0.5,
      mapInstance,
    });

    // 开发模式下初始化 DevTools 控制器
    if (config.isDev) {
      this.devToolsController = new DevToolsController({ mapInstance });
    }

    // 设置 selection 的回调，通过 controller 批量更新 selected 状态
    const pendingUpdates = new Map<string, { mapId: MapData['id']; levelLogicId: number; selected: boolean }>();

    mapInstance.selection.setOnSelectionChange((feature, selected) => {
      const dataInstance = feature.get(EntityInstanceKey) as EntityDataInstance | undefined;
      if (!dataInstance) return;

      // 状态没变化，跳过
      if (dataInstance.selected === selected) return;

      const mapId = this.mapController.dataManager.currentMapId;
      const levelLogicId = dataInstance.id;
      const key = `${mapId}-${levelLogicId}`;

      // 收集待更新的项
      pendingUpdates.set(key, { mapId, levelLogicId, selected });

      // 使用 requestAnimationFrame 批量更新
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
    this.hoverFeatureController.setDebounceTime(time);
    this.hoverConnectionController.setDebounceTime(time);
  }

  /**
   * 设置是否启用聚合标点
   * @param enable 是否启用聚合
   */
  public setClusterEnable(enable: boolean) {
    this.entityController.setClusterEnable(enable);
  }

  /**
   * 移动到指定 entity
   * @param entityId entity的id
   * @param autoToggleVisible 是否自动将该类entity设为visible（如果用户筛选entity的时候取消了显示，就自动打开，可选，默认为true）
   * @param autoSetActive 是否将该entity设为active_feature（这样就会自动打开弹窗，可选，默认为false）
   * @param animationTime 移动视图animate的时间（可选，默认为1s）
   * @param zoom 是否同时调整缩放（默认为undefined，即没有值，如果有值就同时设置缩放）
   */
  public async moveToEntity(
    entityId: string | number,
    autoToggleVisible: boolean = true,
    autoSetActive: boolean = false,
    animationTime: number = 1000,
    zoom?: number
  ): Promise<boolean> {
    const id = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;
    if (isNaN(id)) {
      logger.warn('[EndfieldMapAdapter] Invalid entity ID:', entityId);
      return false;
    }

    // 通过注册表在所有已注册实体类型中搜索
    const mapIds = this.mapController.dataManager.mapIds;
    const targetInstance = this.entityRegistry.searchById(mapIds, id);

    if (!targetInstance) {
      logger.warn(`[moveToEntity] Entity ${id} not found.`);
      return false;
    }

    await this.moveToEntityInstance(targetInstance, autoToggleVisible, autoSetActive, animationTime, zoom);
    return true;
  }

  /**
   * 移动到指定 entity 实例
   * @param instance entity实例
   * @param autoToggleVisible 是否自动将该类entity设为visible（如果用户筛选entity的时候取消了显示，就自动打开，可选，默认为true）
   * @param autoSetActive 是否将该entity设为active_feature（这样就会自动打开弹窗，可选，默认为false）
   * @param animationTime 移动视图animate的时间（可选，默认为1s）
   * @param zoom 是否同时调整缩放（默认为undefined，即没有值，如果有值就同时设置缩放）
   */
  public async moveToEntityInstance(
    instance: EntityDataInstance | ElectricPoleDataInstance | CustomPointDataInstance,
    autoToggleVisible: boolean = true,
    autoSetActive: boolean = false,
    animationTime: number = 1000,
    zoom?: number
  ) {
    const targetMapId = instance.mapId;

    // 切换地图
    if (this.mapController.dataManager.currentMapId !== targetMapId) {
      this.renderMap(targetMapId);
    }

    // 自动切换可见性（通过注册表统一分发）
    if (autoToggleVisible) {
      this.entityRegistry.toggleVisible(instance);
    }

    // 自动激活特征
    if (autoSetActive) {
      this.activeFeatureController.setActiveFeature(instance);
    }

    // 移动地图
    const center = instance.coordinates;
    if (center) {
      this.mapController.olMapRenderer.view.animate({
        center,
        zoom: zoom ?? this.mapController.olMapRenderer.view.getZoom(),
        duration: animationTime,
      });
    }
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
