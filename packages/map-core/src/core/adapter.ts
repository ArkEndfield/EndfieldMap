import { DEFAULT_MAX_ZOOM, DEFAULT_MIN_ZOOM, LayerType, MapIndex } from '@endfieldmap/map-core/const';
import { AreaNameController } from '@endfieldmap/map-core/controller/core/area_name';
import { EndfieldMapLayerController } from '@endfieldmap/map-core/controller/core/layer';
import { MapController } from '@endfieldmap/map-core/controller/core/map';
import { MapLayerController } from '@endfieldmap/map-core/controller/core/map_layer';
import { ZoomController } from '@endfieldmap/map-core/controller/core/zoom';
import { DevToolsController } from '@endfieldmap/map-core/controller/dev_tools';
import { CustomPointController } from '@endfieldmap/map-core/controller/entity/custom_point_controller';
import { DataController } from '@endfieldmap/map-core/controller/entity/data_controller';
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
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/custom_point';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/electric_pole';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { EndfieldMapEvent } from '@endfieldmap/map-core/event/map';
import type { SimpleMapConfig } from '@endfieldmap/map-core/types/map';
import type { JSONLoader, Language, LoggerReporter } from '@endfieldmap/tools';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import type Control from 'ol/control/Control';

export interface AdapterConfig {
  container: HTMLElement;
  asset: EndfieldMapAssetConfig;
  jsonLoader: JSONLoader;
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
  /** JSON加载器 */
  public jsonLoader: JSONLoader;
  /** 地图控制器 */
  public mapController: MapController;
  /** 图层管理器 */
  public layerController: EndfieldMapLayerController;
  /** 事件管理器 */
  public eventManager: EndfieldMapEvent;
  /** 区域名称控制器 */
  public areaNameController: AreaNameController;
  /** 地图图层控制器 */
  public mapLayerController: MapLayerController;
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
  public dataController: DataController;
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
  /** 当前地图索引 */
  @observable accessor currentMapIndex: MapIndex = MapIndex.MAP01;
  /** 是否开启hover效果 */
  @observable accessor enableHover: boolean = true;
  /** hover debounce time */
  @observable accessor hoverDebounceTime: number = 0;

  constructor(config: AdapterConfig) {
    if (config.consolaReporter) {
      logger.addReporter(config.consolaReporter);
    }
    const mapConfig: SimpleMapConfig & { maxZoom: number; minZoom: number } = {
      ...(config.map || {}),
      maxZoom: config.map?.maxZoom ?? DEFAULT_MAX_ZOOM,
      minZoom: config.map?.minZoom ?? DEFAULT_MIN_ZOOM,
    };
    this.event = mapEventEmitter;
    this.container = config.container;
    this.asset = new EndfieldMapAsset(config.asset);
    this.jsonLoader = config.jsonLoader;
    this.mapController = new MapController({
      asset: this.asset,
      mapConfig: {
        container: this.container,
        ...mapConfig,
      },
    });
    this.eventManager = new EndfieldMapEvent(this.mapController.mapRenderer.map, this.mapController.mapRenderer.view);
    this.layerController = new EndfieldMapLayerController(this.mapController.mapRenderer.map);
    this.mapLayerController = new MapLayerController({
      tileUrl: this.asset.mapImage,
      projection: this.mapController.mapRenderer.projection,
      maxZoom: mapConfig.maxZoom,
    });
    this.areaNameController = new AreaNameController({
      jsonLoader: this.jsonLoader,
      asset_path: this.asset.areaName,
    });
    this.entityController = new EntityController({
      jsonLoader: this.jsonLoader,
      dataPath: this.asset.entityData,
      imagePath: this.asset.entityImage,
    });
    this.electricPoleController = new ElectricPoleController({
      imagePath: this.asset.entityImage,
    });
    this.customPointController = new CustomPointController({
      icon: {
        imagePath: this.asset.entityImage,
        size: 20,
      },
    });
    this.tierController = new TierController({
      map: this.mapController.mapRenderer.map,
      projection: this.mapController.mapRenderer.projection,
    });
    this.activeFeatureController = new ActiveFeatureController({
      map: this.mapController.mapRenderer.map,
      disableActiveFeature: config.map?.disableActiveFeature,
    });
    this.hoverFeatureController = new HoverFeatureController({
      map: this.mapController.mapRenderer.map,
      getEntityLayers: () => this.entityController?.currentRenderers || [],
      getElectricPoleLayers: () =>
        this.electricPoleController?.currentRenderer ? [this.electricPoleController.currentRenderer] : [],
      getCustomPointLayers: () =>
        this.customPointController?.layerContainer ? [this.customPointController.layerContainer] : [],
      checkIsActive: (instance) => this.activeFeatureController.activeFeature === instance,
      disableHoverFeature: config.map?.disableHoverFeature,
    });
    this.hoverConnectionController = new HoverConnectionController({
      getConnectionLayer: () => this.electricPoleController?.currentRenderer || null,
      disableHoverConnection: config.map?.disableHoverFeature,
    });
    this.dataController = new DataController({
      entityController: this.entityController,
      electricPoleController: this.electricPoleController,
      customPointController: this.customPointController,
    });
    this.eventController = new EventController({
      entityController: this.entityController,
      electricPoleController: this.electricPoleController,
      customPointController: this.customPointController,
    });
    // 初始化popup控制器（默认启用）
    if (config.popup?.enabled !== false) {
      this.popupController = new PopupController({
        map: this.mapController.mapRenderer.map,
      });
    }

    // 初始化缩放控制器
    this.zoomController = new ZoomController();
    // 注册缩放控件到地图
    this.mapController.mapRenderer.map.addControl(this.zoomController);

    this.layerController.addLayer(LayerType.AREA_NAME, this.areaNameController.areaNameLayer);
    this.layerController.addLayer(LayerType.MAP, this.mapLayerController.mapLayer);
    this.layerController.addLayer(LayerType.TIER_OVERLAY_MASK, this.tierController.tierOverlayMaskLayer);
    this.layerController.addLayer(LayerType.TIER, this.tierController.tierLayer);

    this.KeyboardMoveController = new KeyboardMoveController({
      map: this.mapController.mapRenderer.map,
      speed: 0.5,
    });

    // 开发模式下初始化 DevTools 控制器
    if (config.isDev) {
      this.devToolsController = new DevToolsController({
        map: this.mapController.mapRenderer.map,
      });
    }
  }

  /**
   * 渲染地图
   * @param mapIndex 地图索引
   */
  @action
  public renderMap(mapIndex: MapIndex) {
    this.currentMapIndex = mapIndex;
    this.mapLayerController.renderMap(mapIndex);
    this.activeFeatureController.clearActiveFeature();
    this.mapController.selection.stopSelecting();
    this.tierController.clearTier();
  }

  /**
   * 设置区域名称
   * @param mapIndex 地图索引
   * @param language 语言
   */
  public renderAreaName(language: Language) {
    const zoom = this.mapController.mapRenderer.view.getZoom() || 3;
    return this.areaNameController.setAreaName(this.currentMapIndex, language, zoom);
  }

  /**
   * 渲染实体
   * @param mapIndex 地图索引
   */
  @action
  public async renderEntity(mapIndex: MapIndex) {
    this.layerController.removeLayer(LayerType.ENTITY);
    await this.entityController.switchMap(mapIndex);
    const entityLayer = this.entityController.layerContainer;
    if (entityLayer) {
      this.layerController.addLayer(LayerType.ENTITY, entityLayer);
    }
  }

  /**
   * 渲染电线杆
   * @param mapIndex 地图索引
   */
  @action
  public renderElectricPole(mapIndex: MapIndex) {
    this.electricPoleController.switchMap(mapIndex);
    const electricPoleLayer = this.electricPoleController.layerContainer;
    if (electricPoleLayer) {
      this.layerController.addLayer(LayerType.ELECTRIC_POLE, electricPoleLayer);
    }
  }

  /**
   * 渲染自定义标点
   * @param mapIndex 地图索引
   */
  @action
  public renderCustomPoint(mapIndex: MapIndex) {
    this.customPointController.switchMap(mapIndex);
    const customPointLayer = this.customPointController.layerContainer;
    if (customPointLayer) {
      // 先移除旧图层，再添加新图层
      this.layerController.removeLayer(LayerType.CUSTOM_POINT);
      this.layerController.addLayer(LayerType.CUSTOM_POINT, customPointLayer);
    }
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
   * 注册控件到地图
   * @param control OpenLayers控件实例
   */
  public addControl(control: Control): void {
    this.mapController.mapRenderer.map.addControl(control);
  }

  /**
   * 从地图移除控件
   * @param control OpenLayers控件实例
   */
  public removeControl(control: Control): void {
    this.mapController.mapRenderer.map.removeControl(control);
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

    // 确保数据加载完毕
    await this.entityController.dataManager.loadData();
    // 使用加载完毕的数据索引地图
    const mapIndices = Array.from(this.entityController.dataManager.mapData.keys());

    // 1. 搜索游戏内的标点
    for (const mapIndex of mapIndices) {
      const instance = await this.entityController.dataManager.getInstanceById(mapIndex, id);
      if (instance) {
        targetInstance = instance;
        break;
      }
    }

    // 2. 搜索电线杆
    if (!targetInstance) {
      for (const mapIndex of mapIndices) {
        const manager = this.electricPoleController.dataManager.getMapManager(mapIndex);
        const instance = manager.getById(id);
        if (instance) {
          targetInstance = instance;
          break;
        }
      }
    }

    // 3. 搜索自定义标点
    if (!targetInstance) {
      for (const mapIndex of mapIndices) {
        const manager = this.customPointController.dataManager.getMapManager(mapIndex);
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
    const targetMapIndex = instance.mapIndex;
    const entityType = instance.entityType;

    // 切换地图
    if (this.currentMapIndex !== targetMapIndex) {
      this.renderMap(targetMapIndex);
      const currentLanguage = this.areaNameController.areaNameDataManager.language;
      if (currentLanguage) {
        this.renderAreaName(currentLanguage);
      }
      await this.renderEntity(targetMapIndex);
      this.renderElectricPole(targetMapIndex);
      this.renderCustomPoint(targetMapIndex);
    }

    // 自动切换可见性
    if (autoToggleVisible) {
      if (entityType === '#ElectricPole') {
        this.electricPoleController.setElectricPoleVisible(true);
        this.electricPoleController.setZoneVisible(true);
      } else if (entityType === '#CustomPoint') {
        this.customPointController.setCustomPointVisible(true);
      } else {
        // Standard Entity
        const entityInstance = instance as EntityDataInstance;
        this.entityController.showEntity(entityInstance.entityDataIdKey);
      }
    }

    // 自动激活特征
    if (autoSetActive) {
      this.activeFeatureController.setActiveFeature(instance);
    }

    // 移动地图
    const center = instance.coordinates;
    if (center) {
      this.mapController.mapRenderer.view.animate({
        center,
        zoom: zoom ?? this.mapController.mapRenderer.view.getZoom(),
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
      this.mapController.mapRenderer.map.removeControl(this.zoomController);
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
