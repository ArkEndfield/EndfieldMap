import { DEFAULT_CLUSTER_DISTANCE } from '@endfieldmap/map-core/const';
import type { BaseSourceConfig, ClusterOptions } from '@endfieldmap/map-core/render/source/_base';
import SourceBase from '@endfieldmap/map-core/render/source/_base';
import { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import { Cluster } from 'ol/source';
import { action, observable } from 'mobx';
import type { MapIndex } from '@endfieldmap/map-core/const/map';
import type { EntityDataList, EntityInfoData } from '@endfieldmap/map-core/types';
import { debounce } from '@endfieldmap/tools';

export interface EntityFeatureConfig extends BaseSourceConfig {
  mapIndex: MapIndex;
  data: EntityDataList;
  entityInfo: EntityInfoData;
  clusterOptions?: ClusterOptions;
}

export class SingleEntitySource extends SourceBase<MapFeature, EntityFeatureConfig> {
  constructor(config: EntityFeatureConfig) {
    super(config);
    this.initSource();
  }

  private initSource() {
    for (const data of this.config.data) {
      this.features.push(
        new MapFeature({
          data,
          mapIndex: this.config.mapIndex,
          entityInfo: this.config.entityInfo,
        })
      );
    }
    this.source.addFeatures(this.features.getArray().map((feature) => feature.feature));
  }
}

export class ClusterEntitySource extends SingleEntitySource {
  /** clusterSource */
  @observable accessor clusterSource: Cluster;
  /** 防抖的聚合更新函数 */
  private debouncedClusterUpdate: () => void;

  constructor(config: EntityFeatureConfig) {
    super(config);

    this.clusterSource = new Cluster({
      source: this.source,
      distance: this.config.clusterOptions?.distance ?? DEFAULT_CLUSTER_DISTANCE,
    });

    // 创建防抖函数，16ms延迟
    this.debouncedClusterUpdate = debounce(
      () => {
        this.clusterSource.changed();
      },
      16
    );

    // 为每个MapFeature设置onChange回调
    this.features.forEach((feature) => {
      feature.setOnChange(this.debouncedClusterUpdate);
    });
  }

  /**
   * 添加feature
   * @param feature feature实例
   */
  @action
  public addFeature(feature: MapFeature) {
    super.addFeature(feature);
    feature.setOnChange(this.debouncedClusterUpdate);
  }

  /**
   * 移除feature
   * @param feature feature实例
   */
  @action
  public removeFeature(feature: MapFeature) {
    super.removeFeature(feature);
    feature.setOnChange(this.debouncedClusterUpdate);
  }
}
