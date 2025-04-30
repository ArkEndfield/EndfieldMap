import { Style } from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';

/**
 * 样式缓存条目类型
 */
export interface StyleCacheEntry {
  style: Style | Style[];
  needsUpdate?: boolean;
}

/**
 * 实体组类型
 */
export interface EntityGroup {
  name: string;
  points: Feature<Point>[];
}

/**
 * 选择状态类型
 */
export type SelectionStatus = 'none' | 'partial' | 'all';

/**
 * 图层数据存储
 */
export interface LayerStore {
  features: Feature<Point>[];
  itemMap: Record<string, Feature<Point>>;
  entityGroup: Record<string, EntityGroup>;
  entityClusterLayers: VectorLayer<any>[];
  entityClusterSources: Record<string, Cluster>;
  styleCache: Record<string, StyleCacheEntry>;
  iconStyleCache: Record<string, Promise<Style[] | Style> | undefined>;
  styleCacheCleanupTimers: Record<string, number>;
}
