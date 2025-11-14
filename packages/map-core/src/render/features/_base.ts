import type { MapFeature } from '@endfieldmap/map-core/render/features/feature';
import type { EntityDataList } from '@endfieldmap/map-core/types/entity';
import type { MapIndex } from '@endfieldmap/tools';
import type { Collection, Feature } from 'ol';
import type { Geometry } from 'ol/geom';
import type { Cluster } from 'ol/source';
import type { Options } from 'ol/source/Cluster';
import type VectorSource from 'ol/source/Vector';

export type ClusterOptions = Omit<Options<Feature<Geometry>>, 'source'>;

export interface EntityFeatureConfig {
  mapIndex: MapIndex;
  data: EntityDataList;
  clusterOptions?: ClusterOptions;
}

/** feature基类 */
export default abstract class FeatureBase {
  /** 配置 */
  public config: EntityFeatureConfig;
  /** feature集合 */
  public abstract features: Collection<MapFeature>;
  /** source */
  public abstract source: VectorSource;
  /** clusterSource */
  public abstract clusterSource: Cluster;

  constructor(config: EntityFeatureConfig) {
    this.config = config;
  }
}
