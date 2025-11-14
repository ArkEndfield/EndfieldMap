import { type LayerType } from '@endfieldmap/map-core/const/map';
import type { UnionLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { isMultiLayer } from '@endfieldmap/map-core/render/layers/_base';
import type { Map as OlMap } from 'ol';

/** 地图图层管理器 */
export class EndfieldMapLayerController {
  /** 地图实例 */
  public map: OlMap;
  /** 图层集合 */
  public layers: Map<LayerType, UnionLayerBase> = new Map();

  constructor(map: OlMap) {
    this.map = map;
  }

  /**
   * 添加图层
   * @param type 图层类型
   * @param layer 图层实例
   */
  public addLayer(type: LayerType, layer: UnionLayerBase): void {
    if (isMultiLayer(layer)) {
      layer.layers.forEach((layer) => {
        this.map.addLayer(layer);
      });
    } else {
      this.map.addLayer(layer.layer);
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
    if (isMultiLayer(layer)) {
      layer.layers.forEach((layer) => {
        this.map.removeLayer(layer);
      });
    } else {
      this.map.removeLayer(layer.layer);
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
