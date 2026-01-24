import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { MapRender } from '@endfieldmap/map-core/render/map';
import { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import type { MapConfig, MapDataJson } from '@endfieldmap/map-core/types/map';
import type { Coordinate } from 'ol/coordinate';

export interface MapControllerConfig {
  mapConfig: Omit<MapConfig, 'mapImageUrl'>;
  data: MapDataJson;
}

export class MapController {
  public olMapRenderer: EndfieldMap;
  public mapRenderer: MapRender;
  public dataManager: MapDataManager;

  constructor(config: MapControllerConfig) {
    const { mapConfig } = config;
    this.dataManager = new MapDataManager(config.data);
    this.olMapRenderer = new EndfieldMap(mapConfig);
    this.mapRenderer = new MapRender();
    this.registerEventHandler();
  }

  private registerEventHandler() {
    mapEventEmitter.on(MAP_EVENT.CLUSTER_CLICK, (event) => {
      const { extent } = event;
      this.olMapRenderer.view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
    });
  }

  /**
   * 设置地图中心点
   * @param center 中心点
   */
  public setCenter(center: Coordinate) {
    this.olMapRenderer.view.setCenter(center);
  }

  /**
   * 获取地图中心点
   */
  public getCenter() {
    return this.olMapRenderer.view.getCenter();
  }

  /**
   * 移动视图中心
   * @param center 中心点
   */
  public moveViewCenter(center: Coordinate, zoom?: number) {
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
