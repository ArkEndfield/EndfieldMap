import {
  DEFAULT_NON_ACTIVE_OPACITY,
  DEFAULT_OPACITY,
  type MapIndex,
  type MapType,
  MapTypeKey,
} from '@endfieldmap/map-core/const/map';
import type { MapLayerConfig } from '@endfieldmap/map-core/render/layers/map';
import { MapLayer } from '@endfieldmap/map-core/render/layers/map';

export interface MapLayerControllerConfig extends MapLayerConfig {
  /** 非激活状态下透明度 */
  nonActiveOpacity?: number;
}

export class MapLayerController {
  public mapLayer: MapLayer;
  /** 非激活状态下透明度 */
  public nonActiveOpacity: number;
  /** 透明度 */
  public opacity: number;

  constructor(config: MapLayerControllerConfig) {
    const { nonActiveOpacity, ...mapLayerConfig } = config;
    this.nonActiveOpacity = nonActiveOpacity ?? DEFAULT_NON_ACTIVE_OPACITY;
    this.opacity = mapLayerConfig.opacity ?? DEFAULT_OPACITY;
    this.mapLayer = new MapLayer(mapLayerConfig);
  }

  /**
   * 渲染地图
   * @param mapIndex 地图索引
   */
  public renderMap(mapIndex: MapIndex) {
    this.mapLayer.renderMap(mapIndex);
  }

  /** 高亮地图 */
  public highlightMap(mapType: MapType) {
    this.mapLayer.layers.forEach((layer) => {
      layer.setOpacity(this.nonActiveOpacity);
      if (layer.get(MapTypeKey) === mapType) {
        layer.setOpacity(this.opacity);
      }
    });
  }
}
