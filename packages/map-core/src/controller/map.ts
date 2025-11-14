import { MAP_EVENT } from "@endfieldmap/map-core/const/event";
import type { EndfieldMapAsset } from "@endfieldmap/map-core/data/asset";
import mapEventEmitter from "@endfieldmap/map-core/event/emitter";
import { EndfieldMap } from "@endfieldmap/map-core/render/map";
import type { MapConfig } from "@endfieldmap/map-core/types/map";

export interface MapControllerConfig {
  mapConfig: Omit<MapConfig, 'mapImageUrl'>;
  asset: EndfieldMapAsset;
}

export class MapController {
  public mapRenderer: EndfieldMap;
  constructor(config: MapControllerConfig) {
    const { mapConfig, asset } = config;
    this.mapRenderer = new EndfieldMap({
        ...mapConfig,
        mapImageUrl: asset.mapImage,
    });
    this.registerEventHandler();
  }

  private registerEventHandler() {
    mapEventEmitter.on(MAP_EVENT.CLUSTER_CLICK, (event) => {
      const { extent } = event;
      this.mapRenderer.view.fit(extent, {duration: 500, padding: [50, 50, 50, 50]});
    });
  }
  
  /**
   * 设置地图中心点
   * @param center 中心点
   */
  public setCenter(center: [number, number]) {
    this.mapRenderer.view.setCenter(center);
  }

  /**
   * 设置地图缩放级别
   * @param zoom 缩放级别
   */
  public setZoom(zoom: number) {
    this.mapRenderer.view.setZoom(zoom);
  }

  /**
   * 获取选择交互
   * @returns 选择交互
   */
  public get selection() {
    return this.mapRenderer.selection;
  }
}