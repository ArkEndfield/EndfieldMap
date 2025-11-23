import { LayerType, MapIndex } from '@endfieldmap/map-core/const';
import { ActiveFeatureController } from '@endfieldmap/map-core/controller/active_feature';
import { AreaNameController } from '@endfieldmap/map-core/controller/area_name';
import { DataController } from '@endfieldmap/map-core/controller/data';
import { EntityController } from '@endfieldmap/map-core/controller/entity';
import { EndfieldMapLayerController } from '@endfieldmap/map-core/controller/layer';
import { MapController } from '@endfieldmap/map-core/controller/map';
import { MapLayerController } from '@endfieldmap/map-core/controller/map_layer';
import { PopupController } from '@endfieldmap/map-core/controller/popup';
import type { EndfieldMapAssetConfig } from '@endfieldmap/map-core/data/asset';
import { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { EndfieldMapEvent } from '@endfieldmap/map-core/event/map';
import type { SimpleMapConfig } from '@endfieldmap/map-core/types/map';
import type { JSONLoader, Language, LoggerReporter } from '@endfieldmap/tools';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import { ElectricPoleController } from '@endfieldmap/map-core/controller/electric_pole';
import { EventController } from '@endfieldmap/map-core/controller/event';
import { ZoomController } from '@endfieldmap/map-core/controller/zoom';
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
  /** 事件控制器 */
  public eventController: EventController;
  /** 激活特征控制器 */
  public activeFeatureController: ActiveFeatureController;
  /** 数据控制器 */
  public dataController: DataController;
  /** Popup控制器 */
  public popupController: PopupController | null = null;
  /** 缩放控制器 */
  public zoomController: ZoomController | null = null;
  /** 事件 */
  public event: EndfieldMapEmitter;
  /** 当前地图索引 */
  @observable accessor currentMapIndex: MapIndex = MapIndex.MAP01;

  constructor(config: AdapterConfig) {
    if (config.consolaReporter) {
      logger.addReporter(config.consolaReporter);
    }
    this.event = mapEventEmitter;
    this.container = config.container;
    this.asset = new EndfieldMapAsset(config.asset);
    this.jsonLoader = config.jsonLoader;
    this.mapController = new MapController(
      {
        asset: this.asset,
        mapConfig: {
          container: this.container,
          ...(config.map || {}),
        },
      },
      {
        getEntityLayers: () => this.entityController?.currentMapAllLayers || [],
        getElectricPoleLayers: () => this.electricPoleController?.currentMapAllEntityLayers || [],
      }
    );
    this.eventManager = new EndfieldMapEvent(this.mapController.mapRenderer.map, this.mapController.mapRenderer.view);
    this.layerController = new EndfieldMapLayerController(this.mapController.mapRenderer.map);
    this.layerController.addLayer(LayerType.MAP, this.mapController.mapRenderer.mapLayer);
    this.mapLayerController = new MapLayerController({
      tileUrl: this.asset.mapImage,
      projection: this.mapController.mapRenderer.projection,
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
    this.activeFeatureController = new ActiveFeatureController({
      disableActiveFeature: config.map?.disableActiveFeature,
    });
    this.dataController = new DataController({
      entityController: this.entityController,
    });
    this.electricPoleController = new ElectricPoleController({
      imagePath: `${this.asset.entityImage}/custom`,
    });
    this.eventController = new EventController({
      entityController: this.entityController,
      electricPoleController: this.electricPoleController,
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
  }

  /**
   * 渲染地图
   * @param mapIndex 地图索引
   */
  @action
  public renderMap(mapIndex: MapIndex) {
    this.currentMapIndex = mapIndex;
    this.mapLayerController.renderMap(mapIndex);
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
    await this.entityController.switchMapLayers(mapIndex);
    const entityLayer = this.entityController.entityLayerContainer;
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
    this.electricPoleController.switchMapElectricPoleLayers(mapIndex);
    const electricPoleLayer = this.electricPoleController.layerContainer;
    if (electricPoleLayer) {
      this.layerController.addLayer(LayerType.ELECTRIC_POLE, electricPoleLayer);
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
  public setHoverFeatureEnable(enable: boolean) {
    this.mapController.setHoverFeatureEnable(enable);
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
   * 销毁适配器，清理所有资源
   */
  public dispose(): void {
    // 取消注册缩放控件
    if (this.zoomController) {
      this.mapController.mapRenderer.map.removeControl(this.zoomController);
      this.zoomController.dispose();
    }
    // 清理地图控制器
    this.mapController.dispose();
  }
}
