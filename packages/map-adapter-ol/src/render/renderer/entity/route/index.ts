import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import type { RouteLineData } from '@endfieldmap/map-adapter-ol/render/renderer/entity/route/route_renderer';
import { RouteRenderer } from '@endfieldmap/map-adapter-ol/render/renderer/entity/route/route_renderer';
import type { MapData } from '@endfieldmap/map-core';
import type VectorLayer from 'ol/layer/Vector';

export interface RouteRenderConfig {
  mapInstance: EndfieldMap;
  mapIds: MapData['id'][];
}

/**
 * 路线渲染管理器：为每张地图维护一个 RouteRenderer，并随当前地图切换图层。
 *
 * 与电线杆/自定义标点渲染器同构：不持有数据管理器，图层在 switchMap 时
 * 加入/移除地图实例。
 */
export class RouteRender {
  private renders: Map<MapData['id'], RouteRenderer> = new Map();
  private currentLayers: VectorLayer[] = [];
  private mapInstance: EndfieldMap;
  private visible = true;

  constructor(config: RouteRenderConfig) {
    this.mapInstance = config.mapInstance;
    for (const mapId of config.mapIds) {
      this.renders.set(mapId, new RouteRenderer({ initialVisible: this.visible }));
    }
  }

  /** 全量替换全部地图的折线数据。 */
  public setLinesByMap(linesByMap: Map<MapData['id'], RouteLineData[]>): void {
    for (const [mapId, renderer] of this.renders) {
      renderer.setLines(linesByMap.get(mapId) ?? []);
    }
  }

  /** 切换地图：移除旧图层，添加新图层。 */
  public switchMap(mapId: MapData['id']): void {
    for (const layer of this.currentLayers) {
      this.mapInstance.map.removeLayer(layer);
    }
    this.currentLayers = [];

    const renderer = this.renders.get(mapId);
    if (renderer) {
      this.mapInstance.map.addLayer(renderer.layer);
      this.currentLayers.push(renderer.layer);
    }
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    for (const renderer of this.renders.values()) {
      renderer.setVisible(visible);
    }
  }

  public getVisible(): boolean {
    return this.visible;
  }

  public dispose(): void {
    for (const layer of this.currentLayers) {
      this.mapInstance.map.removeLayer(layer);
    }
    this.currentLayers = [];
    for (const renderer of this.renders.values()) {
      renderer.dispose();
    }
    this.renders.clear();
  }
}
