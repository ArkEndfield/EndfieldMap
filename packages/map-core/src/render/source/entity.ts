import { DEFAULT_CLUSTER_DISTANCE } from '@endfieldmap/map-core/const';
import type { BaseSourceConfig, ClusterOptions } from '@endfieldmap/map-core/render/source/_base';
import SourceBase from '@endfieldmap/map-core/render/source/_base';
import { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import { Cluster } from 'ol/source';
import { action, observable } from 'mobx';
import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { EntityDataList } from '@endfieldmap/map-core/types';

export interface EntityFeatureConfig extends BaseSourceConfig {
  mapIndex: MapIndex;
  data: EntityDataList;
  clusterOptions?: ClusterOptions;
}

export class SingleEntitySource extends SourceBase<MapFeature, EntityFeatureConfig> {
  constructor(config: EntityFeatureConfig) {
    super(config);
    this.initSource();
  }

  private initSource() {
    for (const data of this.config.data) {
      this.features.push(new MapFeature({
        data,
        mapIndex: this.config.mapIndex,
      }));
    }
    this.source.addFeatures(this.features.getArray().map((feature) => feature.feature));
  }
}

export class ClusterEntitySource extends SingleEntitySource {
  /** clusterSource */
  @observable accessor clusterSource: Cluster;

  constructor(config: EntityFeatureConfig) {
    super(config);

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
    super.addFeature(feature);
    feature.setOnChange(() => {
      this.clusterSource.changed();
    });
  }

  /**
   * 移除feature
   * @param feature feature实例
   */
  @action
  public removeFeature(feature: MapFeature) {
    super.removeFeature(feature);
    feature.setOnChange(() => {
      this.clusterSource.changed();
    });
  }
}