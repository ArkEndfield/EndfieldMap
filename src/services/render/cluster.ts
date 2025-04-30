import { debounce } from '@/utils/common';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import { customPointTypes, entityInfo, entityShowStates } from '@/data/entity';
import { isCustomPointType } from '../customPoints';
import {
  addEntityClusterLayer,
  addEntityClusterSource,
  getEntityClusterLayers,
  getEntityClusterSources,
  getFeatures,
  getStore,
  isCluster,
  setIsCluster,
} from './store';
import { createClusterStyleFunction } from './styles';
import { shouldShowByMarkStatus } from '../marks';
import { currentMarkFilter } from '@/data/marks';
import settings from '@/data/settings';

/**
 * 创建聚合图层
 * @returns 聚合图层
 */
export function createEntityClusterLayers(): VectorLayer<any>[] {
  const store = getStore();
  store.entityClusterLayers.length = 0;
  const featuresByType = groupFeaturesByType();

  // 确保自定义标点类型总是有图层
  ensureCustomPointLayers(featuresByType);

  // 为每种类型创建聚合源和图层
  Object.entries(featuresByType).forEach(([entityType, typeFeatures]) => {
    createClusterLayerForType(entityType, typeFeatures);
  });

  return [...store.entityClusterLayers];
}

/**
 * 按类型分组特征
 * @returns 按类型分组特征
 */
function groupFeaturesByType(): Record<string, Feature<Point>[]> {
  const features = getFeatures();
  const featuresByType: Record<string, Feature<Point>[]> = {};

  // 一次遍历完成分组
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const payload = feature.get('payload');
    const entityType = payload?.entityDataIdKey as string;

    if (!entityType) continue;

    const isCustomType = isCustomPointType(entityType);
    // 检查是否为自定义类型或者有数量
    if (isCustomType || entityInfo[entityType]?.entityInfo.count > 0) {
      if (!featuresByType[entityType]) {
        featuresByType[entityType] = [];
      }
      featuresByType[entityType].push(feature);
    }
  }

  return featuresByType;
}

/**
 * 确保自定义标点类型总是有图层
 * @param featuresByType 按类型分组特征
 */
function ensureCustomPointLayers(
  featuresByType: Record<string, Feature<Point>[]>
): void {
  customPointTypes.forEach(customType => {
    if (!featuresByType[customType] && entityInfo[customType]) {
      featuresByType[customType] = [];
    }
  });
}

/**
 * 为特定类型创建聚合图层
 * @param entityType 实体类型
 * @param typeFeatures 类型特征
 */
function createClusterLayerForType(
  entityType: string,
  typeFeatures: Feature<Point>[]
): void {
  const typeSource = new VectorSource({ features: typeFeatures });
  const clusterSource = new Cluster({
    distance: 20,
    source: typeSource,
    geometryFunction: feature => {
      const geometry = feature.getGeometry();
      if (geometry instanceof Point) {
        return geometry;
      }
      return null;
    },
  });

  addEntityClusterSource(entityType, clusterSource);

  const layer = new VectorLayer({
    source: clusterSource,
    style: createClusterStyleFunction(entityType),
    zIndex: 10,
    visible: false,
    updateWhileAnimating: true,
    updateWhileInteracting: true,
  });

  addEntityClusterLayer(layer);
}

/**
 * 优化聚合距离更新函数
 * @param zoom 缩放
 */
export const updateClusterDistance = debounce(
  (zoom: number): void => {
    const shouldCluster = settings.value.isClusteringEnabled && zoom < 4;
    const newDistance = shouldCluster ? 30 : 0;

    const entityClusterSources = getEntityClusterSources();
    const currentSources = Object.values(entityClusterSources);
    if (currentSources.length === 0) {
      console.log('聚合源尚未初始化，跳过更新');
      return;
    }

    const currentDistance = currentSources[0].getDistance();
    if (
      (shouldCluster && currentDistance === 0) ||
      (!shouldCluster && currentDistance > 0) ||
      isCluster !== shouldCluster
    ) {
      console.log(`聚合状态变化：${currentDistance} -> ${newDistance}`);
      setIsCluster(shouldCluster);
      updateAllClusterDistances(newDistance);
    }
  },
  100,
  { leading: false, trailing: true }
);

/**
 * 更新所有聚合距离
 * @param distance 距离
 */
function updateAllClusterDistances(distance: number): void {
  const entityClusterSources = getEntityClusterSources();
  Object.values(entityClusterSources).forEach(source => {
    source.setDistance(distance);
    source.refresh();
  });
}

/**
 * 刷新聚合
 */
export function refreshCluster(): void {
  const entityClusterSources = getEntityClusterSources();
  Object.values(entityClusterSources).forEach(source => {
    source.refresh();
  });
}

/**
 * 刷新地图
 */
export function refreshMap(): void {
  const entityClusterSources = getEntityClusterSources();
  const entityClusterLayers = getEntityClusterLayers();

  if (Object.keys(entityClusterSources).length === 0) {
    createEntityClusterLayers();
  }

  const entityTypes = Object.keys(entityInfo);

  // 预先创建一个图层查找映射，减少嵌套循环中的查找
  const layerBySourceMap = new Map();
  for (let i = 0; i < entityClusterLayers.length; i++) {
    const layer = entityClusterLayers[i];
    const source = layer.getSource();
    if (source) {
      layerBySourceMap.set(source, layer);
    }
  }

  // 使用分批处理来更新图层可见性
  const batchSize = 5; // 每批处理5个实体类型
  const totalEntities = entityTypes.length;

  const processBatch = (startIndex: number) => {
    const endIndex = Math.min(startIndex + batchSize, totalEntities);
    const currentBatch = entityTypes.slice(startIndex, endIndex);

    // 处理当前批次的实体类型
    for (let i = 0; i < currentBatch.length; i++) {
      const key = currentBatch[i];
      const source = entityClusterSources[key];
      if (!source) continue;

      const layer = layerBySourceMap.get(source);
      if (!layer) continue;

      const shouldShowEntityType = entityShowStates[key];
      layer.setVisible(shouldShowEntityType);

      if (shouldShowEntityType) {
        updateSourceFeatures(source, key);
      }
    }

    // 如果还有剩余实体类型，继续处理下一批
    if (endIndex < totalEntities) {
      setTimeout(() => {
        processBatch(endIndex);
      }, 0);
    } else {
      // 所有实体类型处理完成，刷新聚合
      setTimeout(() => {
        refreshCluster();
      }, 0);
    }
  };

  // 开始分批处理
  processBatch(0);
}

/**
 * 更新源特征
 * @param source 源
 * @param entityType 实体类型
 */
function updateSourceFeatures(source: Cluster, entityType: string): void {
  const features = getFeatures();
  const vectorSource = source.getSource();
  if (!vectorSource) return;

  vectorSource.clear();

  // 过滤符合当前实体类型的特征
  let typeFeatures = features.filter(f => {
    const payload = f.get('payload');
    return payload?.entityDataIdKey === entityType;
  });

  // 标记过滤处理
  if (currentMarkFilter.value !== 'all') {
    // 创建一个Set或Map用于快速查找，而不是重复过滤
    const validFeaturesMap = new Map<Feature<Point>, boolean>();

    for (let i = 0; i < typeFeatures.length; i++) {
      const feature = typeFeatures[i];
      const payload = feature.get('payload');
      if (shouldShowByMarkStatus(payload?.levelLogicId)) {
        validFeaturesMap.set(feature, true);
      }
    }

    // 使用过滤后的Map重建特征数组
    typeFeatures = Array.from(validFeaturesMap.keys());
  }

  // 批量添加特征，减少单独添加的次数
  if (typeFeatures.length > 0) {
    vectorSource.addFeatures(typeFeatures);
    source.refresh();
  }
}
