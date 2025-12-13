import { DEFAULT_CLUSTER_DISTANCE } from '@endfieldmap/map-core/const';
import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { EntityInstanceKey, MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import type { BaseSourceConfig, ClusterOptions } from '@endfieldmap/map-core/render/source/_base';
import SourceBase from '@endfieldmap/map-core/render/source/_base';
import { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { EntityDataList, EntityInfoData } from '@endfieldmap/map-core/types';
import { debounce } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import type { Feature } from 'ol';
import type { Point } from 'ol/geom';
import { Cluster } from 'ol/source';
import type VectorSource from 'ol/source/Vector';

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
    this.source.addFeatures(this.features.map((feature) => feature.feature));
  }
}

export class ClusterEntitySource extends SingleEntitySource {
  /** clusterSource */
  @observable accessor clusterSource: Cluster;
  /** 防抖的聚合更新函数 */
  private debouncedClusterUpdate: () => void;
  /** marked feature 过滤模式 */
  @observable accessor markedFilterMode: MarkedFeatureFilterMode = MarkedFeatureFilterMode.All;

  constructor(config: EntityFeatureConfig) {
    super(config);

    this.clusterSource = new Cluster({
      source: this.source as VectorSource<Feature<Point>>,
      distance: this.config.clusterOptions?.distance ?? DEFAULT_CLUSTER_DISTANCE,
      geometryFunction: this.createGeometryFunction(),
    });

    // 创建防抖函数，16ms延迟
    this.debouncedClusterUpdate = debounce(() => {
      this.clusterSource.changed();
    }, 16);

    // 为每个MapFeature设置onChange回调
    this.features.forEach((feature) => {
      feature.setOnChange(this.debouncedClusterUpdate);
    });
  }

  /**
   * 创建聚合的 geometryFunction，用于过滤被筛选掉的 feature
   * 返回 null 的 feature 不会参与聚合计算
   */
  private createGeometryFunction(): (feature: Feature<Point>) => Point | null {
    return (feature: Feature<Point>) => {
      const mapFeature = feature.get(EntityInstanceKey) as MapFeature | undefined;
      if (!mapFeature) {
        return feature.getGeometry() ?? null;
      }

      // 根据过滤模式判断是否参与聚合
      if (this.markedFilterMode === MarkedFeatureFilterMode.Marked && !mapFeature.marked) {
        return null;
      }
      if (this.markedFilterMode === MarkedFeatureFilterMode.Unmarked && mapFeature.marked) {
        return null;
      }

      return feature.getGeometry() ?? null;
    };
  }

  /**
   * 设置 marked feature 过滤模式
   * @param mode 过滤模式
   */
  @action
  public setMarkedFilterMode(mode: MarkedFeatureFilterMode) {
    if (this.markedFilterMode === mode) {
      return;
    }
    this.markedFilterMode = mode;
    // 触发聚合重新计算
    this.clusterSource.changed();
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
