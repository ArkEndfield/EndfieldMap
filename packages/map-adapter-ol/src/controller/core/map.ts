import { MapRender } from '@endfieldmap/map-adapter-ol/render/map';
import { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { EndfieldMapAsset, EndfieldMapEmitter, MapConfig, MapCoordinate, MapDataJson } from '@endfieldmap/map-core';
import { MAP_EVENT, MapDataManager } from '@endfieldmap/map-core';
import type { IMapView } from '@endfieldmap/map-core/interfaces/map_view';

export interface MapControllerConfig {
  mapConfig: Omit<MapConfig, 'mapImageUrl'>;
  data: MapDataJson;
  asset: EndfieldMapAsset;
  emitter: EndfieldMapEmitter<OLMapEventPayloads>;
}

export class MapController {
  public olMapRenderer: EndfieldMap;
  public mapRenderer: MapRender;
  public dataManager: MapDataManager;
  private emitter: EndfieldMapEmitter<OLMapEventPayloads>;

  /** IMapController.view：ol View 与 IMapView 方法集结构兼容。 */
  get view(): IMapView | undefined {
    return this.olMapRenderer.view as unknown as IMapView;
  }

  constructor(config: MapControllerConfig) {
    const { mapConfig } = config;
    this.emitter = config.emitter;
    this.dataManager = new MapDataManager(config.data);
    this.olMapRenderer = new EndfieldMap(mapConfig, this.emitter);
    this.mapRenderer = new MapRender({
      mapDataManager: this.dataManager,
      mapInstance: this.olMapRenderer,
      asset: config.asset,
    });
    this.registerEventHandler();
  }

  private registerEventHandler() {
    this.emitter.on(MAP_EVENT.CLUSTER_CLICK, (event) => {
      const { extent } = event;
      this.olMapRenderer.view.fit(extent, { duration: 500, padding: [50, 50, 50, 50], maxZoom: 6 });
    });
  }

  /**
   * 设置地图中心点
   * @param center 中心点
   */
  public setCenter(center: MapCoordinate) {
    this.olMapRenderer.view.setCenter(center);
  }

  /**
   * 获取地图中心点
   */
  public getCenter(): MapCoordinate | undefined {
    return this.olMapRenderer.view.getCenter() as MapCoordinate | undefined;
  }

  /**
   * 移动视图中心
   * @param center 中心点
   */
  public moveViewCenter(center: MapCoordinate, zoom?: number) {
    this.olMapRenderer.view.animate({
      center,
      zoom,
      duration: 500,
    });
  }

  /**
   * 设置地图缩放级别
   * @param zoom 缩放级别
   */
  public setZoom(zoom: number) {
    this.olMapRenderer.view.setZoom(zoom);
  }

  /**
   * 获取选择交互
   * @returns 选择交互
   */
  public get selection() {
    return this.olMapRenderer.selection;
  }

  /**
   * 渲染地图
   */
  public renderMap(id: string) {
    this.dataManager.setCurrentMap(id);
    this.mapRenderer.renderMap();
  }

  /**
   * 销毁控制器，清理资源
   */
  public dispose() {
    // 清理地图资源
  }
}
