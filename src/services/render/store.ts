import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
import { LayerStore, StyleCacheEntry } from '@/types/render';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import settings from '@/data/settings';
import { ELECTRIC_POLE_RANGE_COLOR } from '@/services/render/constants';

/**
 * 全局状态 - 是否聚合
 */
export let isCluster = true;

// 允许修改isCluster的方法
export function setIsCluster(value: boolean): void {
  isCluster = value;
}

/**
 * 图层存储
 */
const store: LayerStore = {
  // 特征数据
  features: [],
  // 特征数据Map
  itemMap: {},
  // 实体组
  entityGroup: {},
  // 样式缓存和图层容器
  styleCache: {},
  entityClusterLayers: [],
  entityClusterSources: {},
  // 样式创建函数缓存
  iconStyleCache: {},
  styleCacheCleanupTimers: {},
};

/**
 * 电线杆范围层
 */
export const electricPoleRangeLayer = new VectorLayer({
  source: new VectorSource(),
  style: (feature, resolution) => {
    const payload = feature.get('payload');
    const radiusInMeters = payload?.radius || 0;

    if (radiusInMeters === 0) {
      return undefined; // 如果没有半径，不渲染任何东西
    }

    // 根据地图分辨率动态计算半径
    // resolution 是每像素代表的地图单位数（米）
    const radiusInPixels = radiusInMeters / resolution;
    
    return new Style({
      image: new CircleStyle({
        radius: radiusInPixels,
        fill: new Fill({ color: ELECTRIC_POLE_RANGE_COLOR }),
        stroke: new Stroke({
          color: 'rgba(255, 255, 0, 0.6)',
          width: 1,
        }),
      }),
    });
  },
  updateWhileAnimating: true, // 在动画过程中更新样式
  updateWhileInteracting: true, // 在交互过程中更新样式
  zIndex: 1, // 在标点层下方
  visible: settings.value.showElectricPoleRange, // 根据设置决定初始可见性
});

/**
 * 源数据管理
 */
export const source = new WebGLVectorLayer({
  source: new VectorSource<Feature<Point>>({
    features: [],
  }),
  style: {
    'circle-radius': 6,
    'circle-fill-color': '#3399CC',
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 2,
  },
  disableHitDetection: false,
});

// 导出访问器和修改器函数
export const getFeatures = () => [...store.features];
export const getItemMap = () => ({ ...store.itemMap });
export const getEntityGroup = () => ({ ...store.entityGroup });
export const getSource = () => source;
export const getStyleCache = () => ({ ...store.styleCache });
export const getEntityClusterLayers = () => [...store.entityClusterLayers];
export const getEntityClusterSources = () => ({
  ...store.entityClusterSources,
});

/**
 * 添加特征
 */
export const addFeature = (feature: Feature<Point>) => {
  store.features.push(feature);
};

/**
 * 添加特征到itemMap
 */
export const addFeatureToItemMap = (
  id: string | number,
  feature: Feature<Point>
) => {
  store.itemMap[id] = feature;
};

/**
 * 从itemMap中移除特征
 */
export const removeFeatureFromItemMap = (id: string) => {
  delete store.itemMap[id];
};

/**
 * 添加特征到实体组
 */
export const addFeatureToEntityGroup = (
  entityType: string,
  feature: Feature<Point>,
  entityName: string = ''
) => {
  if (!store.entityGroup[entityType]) {
    store.entityGroup[entityType] = {
      name: entityName,
      points: [],
    };
  }
  store.entityGroup[entityType].points.push(feature);
};

/**
 * 从实体组中移除特征
 */
export const removeFeatureFromEntityGroup = (
  entityType: string,
  feature: Feature<Point>
) => {
  if (store.entityGroup[entityType]) {
    const index = store.entityGroup[entityType].points.indexOf(feature);
    if (index !== -1) {
      store.entityGroup[entityType].points.splice(index, 1);
    }
  }
};

/**
 * 添加样式到缓存
 */
export const addStyleToCache = (key: string, style: StyleCacheEntry) => {
  store.styleCache[key] = style;
};

/**
 * 从缓存中移除样式
 */
export const removeStyleFromCache = (key: string) => {
  delete store.styleCache[key];
};

/**
 * 添加图层
 */
export const addEntityClusterLayer = (layer: VectorLayer<any>) => {
  store.entityClusterLayers.push(layer);
};

/**
 * 移除图层
 */
export const removeEntityClusterLayer = (layer: VectorLayer<any>) => {
  const index = store.entityClusterLayers.indexOf(layer);
  if (index !== -1) {
    store.entityClusterLayers.splice(index, 1);
  }
};

/**
 * 添加聚合源
 */
export const addEntityClusterSource = (key: string, source: Cluster) => {
  store.entityClusterSources[key] = source;
};

/**
 * 移除聚合源
 */
export const removeEntityClusterSource = (key: string) => {
  delete store.entityClusterSources[key];
};

/**
 * 获取图层存储直接引用（仅供内部使用）
 * @internal
 */
export const getStore = () => store;

/**
 * 从全局 features 数组中移除特征
 */
export const removeFeature = (featureToRemove: Feature<Point>) => {
  const store = getStore(); // 获取 store 引用
  const index = store.features.indexOf(featureToRemove);
  if (index !== -1) {
    store.features.splice(index, 1);
    console.log('Feature removed from store.features'); // 调试信息
  } else {
    console.warn('Feature to remove not found in store.features'); // 调试信息
  }
};

/**
 * 优化清空所有数据函数
 */
export const clearAllData = () => {
  // 清除所有定时器
  Object.values(store.styleCacheCleanupTimers).forEach(clearTimeout);

  // 先清空图层和源
  for (let i = 0; i < store.entityClusterLayers.length; i++) {
    const layer = store.entityClusterLayers[i];
    const source = layer.getSource();
    if (source) {
      source.getSource()?.clear();
    }
  }

  // 然后一次性清空主源
  const vectorSource = source.getSource();
  if (vectorSource) {
    vectorSource.clear();
  }

  // 最后批量清空所有缓存对象
  // 使用Object.keys一次性获取键列表，减少重复遍历
  const iconStyleKeys = Object.keys(store.iconStyleCache);
  const timerKeys = Object.keys(store.styleCacheCleanupTimers);
  const styleCacheKeys = Object.keys(store.styleCache);
  const itemMapKeys = Object.keys(store.itemMap);
  const entityGroupKeys = Object.keys(store.entityGroup);
  const entityClusterSourceKeys = Object.keys(store.entityClusterSources);

  // 清空各缓存对象
  iconStyleKeys.forEach(key => delete store.iconStyleCache[key]);
  timerKeys.forEach(key => delete store.styleCacheCleanupTimers[key]);
  styleCacheKeys.forEach(key => delete store.styleCache[key]);
  itemMapKeys.forEach(key => delete store.itemMap[key]);
  entityGroupKeys.forEach(key => delete store.entityGroup[key]);
  entityClusterSourceKeys.forEach(
    key => delete store.entityClusterSources[key]
  );

  // 清空数组
  store.features.length = 0;
  store.entityClusterLayers.length = 0;
};
