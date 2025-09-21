/**
 * 渲染服务主入口
 * @module render
 */

// 重新导出常量
export * from '@/services/render/constants';

// 重新导出核心功能
export {
  // 存储相关
  getFeatures,
  getItemMap,
  getEntityGroup,
  getSource,
  getStyleCache,
  getEntityClusterLayers,
  getEntityClusterSources,
  addFeature,
  addFeatureToItemMap,
  removeFeatureFromItemMap,
  addFeatureToEntityGroup,
  removeFeatureFromEntityGroup,
  addStyleToCache,
  removeStyleFromCache,
  addEntityClusterLayer,
  removeEntityClusterLayer,
  addEntityClusterSource,
  removeEntityClusterSource,
  clearAllData,
  isCluster,
  setIsCluster,
} from '@/services/render/store';

// 重新导出样式相关功能
export {
  createCircleIconStyle,
  createBaseStyles,
  createOuterCircleStyle,
  createInnerCircleStyle,
  createLeftDecoration,
  createRightDecoration,
  createBottomTriangleIndicator,
  createIconStyle,
  createClusterStyle,
  createClusterStyleFunction,
  applyOpacityToStyles,
  applyOpacityToFillAndStroke,
} from '@/services/render/styles';

// 重新导出缓存相关功能
export { setupCacheCleanup } from '@/services/render/cache';

// 重新导出聚合相关功能
export {
  createEntityClusterLayers,
  updateClusterDistance,
  refreshCluster,
  refreshMap,
} from '@/services/render/cluster';

// 重新导出标记相关功能
export {
  marker,
  createCustomPointMarker,
  removeCustomPointMarker,
  updateCustomPointMarker,
  clearCustomPointsOnMap,
  resetEntityInfoCount,
  updateEntityInfoCount,
  populateFeaturesFromPoints,
} from '@/services/render/markers';
