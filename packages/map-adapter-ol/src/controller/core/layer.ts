import type { UnionLayerBase } from '@endfieldmap/map-adapter-ol/render/layers/_base';
import { isMultiLayer } from '@endfieldmap/map-adapter-ol/render/layers/_base';
import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import { type LayerType } from '@endfieldmap/map-core';

/** 地图图层管理器 */
export class EndfieldMapLayerController {
  /** 图层集合 */
  public layers: Map<LayerType, UnionLayerBase> = new Map();
  private mapInstance: EndfieldMap;

  constructor(mapInstance: EndfieldMap) {
    this.mapInstance = mapInstance;
  }

  /**
   * 添加图层
   * @param type 图层类型
   * @param layer 图层实例
   */
  public addLayer(type: LayerType, layer: UnionLayerBase): void {
    const map = this.mapInstance.map;
    // 如果该类型已有图层，先移除，避免向地图重复添加相同的 layer 实例
    const existing = this.layers.get(type);
    if (existing) {
      this.removeLayer(type);
    }

    if (isMultiLayer(layer)) {
      layer.layers.forEach((layer) => {
        map.addLayer(layer);
      });
    } else {
      map.addLayer(layer.layer);
    }
    this.layers.set(type, layer);
  }

  /**
   * 获取图层
   * @param type 图层类型
   * @returns 图层实例
   */
  public getLayer<T extends UnionLayerBase>(type: LayerType): T {
    return this.layers.get(type) as T;
  }

  /**
   * 移除图层
   * @param type 图层类型
   */
  public removeLayer(type: LayerType): void {
    const layer = this.layers.get(type);
    if (!layer) return;
    const map = this.mapInstance.map;
    if (isMultiLayer(layer)) {
      layer.layers.forEach((layer) => {
        map.removeLayer(layer);
      });
    } else {
      map.removeLayer(layer.layer);
    }
    this.layers.delete(type);
  }

  /**
   * 获取所有图层
   * @returns 图层实例集合
   */
  public getLayers(): UnionLayerBase[] {
    return Array.from(this.layers.values());
  }
}
