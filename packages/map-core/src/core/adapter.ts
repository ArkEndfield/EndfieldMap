import { LayerType } from '@endfieldmap/map-core/const';
import { AreaNameController } from '@endfieldmap/map-core/controller/core/area_name';
import { EndfieldMapLayerController } from '@endfieldmap/map-core/controller/core/layer';
import { MapController } from '@endfieldmap/map-core/controller/core/map';
import { ZoomController } from '@endfieldmap/map-core/controller/core/zoom';
import { DevToolsController } from '@endfieldmap/map-core/controller/dev_tools';
import { CustomPointController } from '@endfieldmap/map-core/controller/entity/custom_point_controller';
// import { DataController } from '@endfieldmap/map-core/controller/entity/data_controller';
import { ElectricPoleController } from '@endfieldmap/map-core/controller/entity/electric_pole_controller';
import { EntityController } from '@endfieldmap/map-core/controller/entity/entity_controller';
import { ActiveFeatureController } from '@endfieldmap/map-core/controller/feature/active_feature';
import { HoverConnectionController } from '@endfieldmap/map-core/controller/feature/hover_connection';
import { HoverFeatureController } from '@endfieldmap/map-core/controller/feature/hover_feature';
import { EventController } from '@endfieldmap/map-core/controller/interaction/event';
import { KeyboardMoveController } from '@endfieldmap/map-core/controller/interaction/keyboard';
import { PopupController } from '@endfieldmap/map-core/controller/interaction/popup';
import { TierController } from '@endfieldmap/map-core/controller/tier';
import type { EndfieldMapAssetConfig } from '@endfieldmap/map-core/data/asset';
import { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import { EndfieldMapEvent } from '@endfieldmap/map-core/event/map';
import type { MapData, MapDataJson, SimpleMapConfig } from '@endfieldmap/map-core/types/map';
import type { JSONLoader, LoggerReporter } from '@endfieldmap/tools';
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
  public KeyboardMoveController: KeyboardMoveController | null = null;
  /** DevTools 控制器（仅开发模式） */
  public devToolsController: DevToolsController | null = null;
  /** 事件 */
  public event: EndfieldMapEmitter;
  /** 是否开启hover效果 */
  @observable accessor enableHover: boolean = true;
  /** hover debounce time */
  @observable accessor hoverDebounceTime: number = 0;

  constructor(config: AdapterConfig) {
    if (config.consolaReporter) {
      logger.addReporter(config.consolaReporter);
    }
    const mapConfig: SimpleMapConfig = {
      ...(config.map || {}),
    };
    this.event = new EndfieldMapEmitter();
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
    this.activeFeatureController = new ActiveFeatureController({
      disableActiveFeature: config.map?.disableActiveFeature,
      mapInstance,
      emitter: this.event,
    });
    this.hoverFeatureController = new HoverFeatureController({
      getEntityLayers: () => this.entityController?.render.currentRenderer || [],
      getElectricPoleLayers: () =>
        this.electricPoleController?.currentRenderer ? [this.electricPoleController.currentRenderer] : [],
      getCustomPointLayers: () =>
        this.customPointController?.currentRenderer ? [this.customPointController.currentRenderer] : [],
      checkIsActive: (instance) => this.activeFeatureController.activeFeature === instance,
      disableHoverFeature: config.map?.disableHoverFeature,
      mapInstance,
      emitter: this.event,
    });
    this.hoverConnectionController = new HoverConnectionController({
      getConnectionLayer: () => this.electricPoleController?.currentRenderer || null,
      disableHoverConnection: config.map?.disableHoverFeature,
      emitter: this.event,
    });
    this.eventController = new EventController({
      entityController: this.entityController,
      electricPoleController: this.electricPoleController,
      customPointController: this.customPointController,
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

    this.KeyboardMoveController = new KeyboardMoveController({
      speed: 0.5,
      mapInstance,
    });

    // 开发模式下初始化 DevTools 控制器
    if (config.isDev) {
      this.devToolsController = new DevToolsController({ mapInstance });
    }
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
  ) {
    const id = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;
    if (isNaN(id)) {
      logger.warn('[EndfieldMapAdapter] Invalid entity ID:', entityId);
      return;
    }

    let targetInstance: EntityDataInstance | ElectricPoleDataInstance | CustomPointDataInstance | undefined;

    // 使用加载完毕的数据索引地图
    const mapIds = this.mapController.dataManager.mapIds;

    // 1. 搜索游戏内的标点
    for (const mapId of mapIds) {
      const instance = this.entityController.dataManager.getInstanceById(mapId, id);
      if (instance) {
        targetInstance = instance;
        break;
      }
    }

    // 2. 搜索电线杆
    if (!targetInstance) {
      for (const mapId of mapIds) {
        const manager = this.electricPoleController.dataManager.getMapManager(mapId);
        const instance = manager.getById(id);
        if (instance) {
          targetInstance = instance;
          break;
        }
      }
    }

    // 3. 搜索自定义标点
    if (!targetInstance) {
      for (const mapId of mapIds) {
        const manager = this.customPointController.dataManager.getMapManager(mapId);
        const instance = manager.getById(id);
        if (instance) {
          targetInstance = instance;
          break;
        }
      }
    }

    // TODO： 如果以后新增的话需要更新

    if (!targetInstance) {
      logger.warn(`[moveToEntity] Entity ${id} not found.`);
      return;
    }

    await this.moveToEntityInstance(targetInstance, autoToggleVisible, autoSetActive, animationTime, zoom);
  }

  /**
   * 移动到指定 entity 实例
   * @param instance entity实例 TODO: 如果以后增加的话，这里要同步更新
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
    const entityType = instance.entityType;

    // 切换地图
    if (this.mapController.dataManager.currentMapId !== targetMapId) {
      this.renderMap(targetMapId);
    }

    // 自动切换可见性
    if (autoToggleVisible) {
      if (entityType === '#ElectricPole') {
        this.electricPoleController.setVisible(true);
        this.electricPoleController.setZoneVisible(true);
      } else if (entityType === '#CustomPoint') {
        this.customPointController.setCustomPointVisible(true);
      } else {
        // Standard Entity
        const entityInstance = instance as EntityDataInstance;
        this.entityController.setVisibility(entityInstance.mapId, entityInstance.entityDataIdKey, true);
      }
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
    // 取消注册缩放控件
    if (this.zoomController) {
      this.mapController.olMapRenderer.map.removeControl(this.zoomController);
      this.zoomController.dispose();
    }
    // 清理 DevTools 控制器
    if (this.devToolsController) {
      this.devToolsController.dispose();
    }
    // 清理地图控制器
    this.mapController.dispose();
  }
}
