import type { MapIndex } from '@endfieldmap/tools';
import type { Feature } from 'ol';
import type { Geometry } from 'ol/geom';
import type { Options } from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';
import type FeatureBase from '@endfieldmap/map-core/render/source/feature/_base';
import { action, observable } from 'mobx';

export type ClusterOptions = Omit<Options<Feature<Geometry>>, 'source'>;

export interface BaseSourceConfig {
  mapIndex: MapIndex;
}

/** feature基类 */
export default abstract class SourceBase<T extends FeatureBase, C extends BaseSourceConfig> {
  /** 配置 */
  public config: C;
  /** feature集合 - 使用 MobX observable 数组 */
  @observable accessor features: T[] = [];
  /** source */
  @observable accessor source: VectorSource;

  constructor(config: C) {
    this.config = config;
    this.source = new VectorSource();
  }

  /**
   * 添加feature
   * @param feature feature实例
   */
  @action
  public addFeature(feature: T) {
    this.features.push(feature);
    this.source.addFeature(feature.feature);
  }

  /**
   * 添加多个feature
   * @param features feature实例集合
   */
  @action
  public addFeatures(features: T[]) {
    this.features.push(...features);
    this.source.addFeatures(features.map((feature) => feature.feature));
  }

  /**
   * 移除feature
   * @param feature feature实例
   */
  @action
  public removeFeature(feature: T) {
    const index = this.features.indexOf(feature);
    if (index > -1) {
      this.features.splice(index, 1);
    }
    this.source.removeFeature(feature.feature);
  }

  /**
   * 清空feature
   */
  @action
  public clearFeatures() {
    this.features.length = 0;
    this.source.clear();
  }
}
