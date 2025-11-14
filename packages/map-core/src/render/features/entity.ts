import { DEFAULT_CLUSTER_DISTANCE } from '@endfieldmap/map-core/const';
import type { EntityFeatureConfig } from '@endfieldmap/map-core/render/features/_base';
import FeatureBase from '@endfieldmap/map-core/render/features/_base';
import { MapFeature } from '@endfieldmap/map-core/render/features/feature';
import { Collection } from 'ol';
import { Cluster } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { action, observable } from 'mobx';

export class EntityFeature extends FeatureBase {
  /** feature集合 */
  @observable accessor features: Collection<MapFeature>;
  /** source */
  @observable accessor source: VectorSource;
  /** clusterSource */
  @observable accessor clusterSource: Cluster;

  constructor(config: EntityFeatureConfig) {
    super(config);
    this.features = new Collection(
      this.config.data.map(
        (data) =>
          new MapFeature({
            data,
            mapIndex: config.mapIndex,
          })
      )
    );
    this.source = new VectorSource({
      features: this.features.getArray().map((feature) => feature.feature),
    });
    this.clusterSource = new Cluster({
      source: this.source,
      distance: this.config.clusterOptions?.distance ?? DEFAULT_CLUSTER_DISTANCE,
    });
    
    // 为每个MapFeature设置onChange回调
    this.features.forEach((feature) => {
      feature.setOnChange(() => {
        this.clusterSource.changed();
      });
    });
  }

  /**
   * 添加feature
   * @param feature feature实例
   */
  @action
  public addFeature(feature: MapFeature) {
    feature.setOnChange(() => {
      this.clusterSource.changed();
    });
    this.features.push(feature);
    this.source.addFeature(feature.feature);
  }

  /**
   * 移除feature
   * @param feature feature实例
   */
  @action
  public removeFeature(feature: MapFeature) {
    this.features.remove(feature);
    this.source.removeFeature(feature.feature);
  }

  /**
   * 清空feature
   */
  @action
  public clearFeatures() {
    this.features.clear();
    this.source.clear();
  }
}
