import type BaseLayer from 'ol/layer/Base';

/** 图层基类 */
export abstract class SingleLayerBase {
  public isMultiLayer = false;
  /** 图层实例集合 */
  public abstract layer: BaseLayer;
}

export abstract class MultiLayerBase {
  public isMultiLayer = true;
  /** 图层实例集合 */
  public abstract get layers(): BaseLayer[];
}

export type UnionLayerBase = SingleLayerBase | MultiLayerBase;

export function isMultiLayer(layer: SingleLayerBase | MultiLayerBase): layer is MultiLayerBase {
  return layer.isMultiLayer;
}
