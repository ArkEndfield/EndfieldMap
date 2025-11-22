import { MultiLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import type BaseLayer from 'ol/layer/Base';

/**
 * 多图层容器
 * 用于管理多个实体图层
 */
export class MultiLayerContainer extends MultiLayerBase {
  /** 图层实例集合 */
  public layers: BaseLayer[];

  constructor(layers: BaseLayer[]) {
    super();
    this.layers = layers;
  }
}
