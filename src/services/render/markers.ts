import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import { PointData } from '@/types/points';
import { xyz2crd } from '@/utils/common';
import { entityInfo } from '@/data/entity';
import { customPointTypes } from '@/data/entity';
import {
  addFeature,
  addFeatureToEntityGroup,
  addFeatureToItemMap,
  getFeatures,
  getItemMap,
  source,
  removeFeatureFromItemMap as removeFeatureFromItemMapStore,
  getEntityGroup,
} from './store';

/**
 * 创建标记
 * @param entry 点数据
 * @returns 特征点
 */
export const marker = (entry: PointData): Feature<Point> | undefined => {
  const info = entityInfo[entry.entityDataIdKey];
  if (!info) return undefined;

  const feature = new Feature({
    geometry: new Point(xyz2crd(entry.position)),
    payload: entry,
  });

  const entityType = entry.entityDataIdKey;
  addFeatureToEntityGroup(entityType, feature, info.entityInfo.name);

  return feature;
};

/**
 * 创建自定义标点标记
 * @param point 点数据
 * @returns 特征点
 */
export function createCustomPointMarker(
  point: PointData
): Feature<Point> | null {
  const feature = marker(point);
  if (!feature) return null;

  addFeature(feature);
  addFeatureToItemMap(Number(point.levelLogicId), feature);

  const vectorSource = source.getSource();
  if (vectorSource && vectorSource instanceof VectorSource) {
    vectorSource.addFeature(feature);
  } else {
    console.error('source.getSource() is not an instance of VectorSource');
  }

  return feature;
}

/**
 * 删除自定义标点标记
 * @param levelLogicId 逻辑ID
 */
export function removeCustomPointMarker(levelLogicId: string | number): void {
  const features = getFeatures();
  // 如果itemMap已经有对应的feature，直接使用
  const featureFromMap = getFeatureFromItemMap(levelLogicId);
  const toRemove: Feature<Point>[] = [];

  if (featureFromMap) {
    // 已有缓存，直接使用
    toRemove.push(featureFromMap);
  } else {
    // 没有缓存，需要查找
    toRemove.push(
      ...features.filter(f => f.get('payload')?.levelLogicId === levelLogicId)
    );
  }

  if (toRemove.length === 0) return;

  const vectorSource = source.getSource();
  toRemove.forEach(feature => {
    // 从 features 数组移除
    const idx = features.indexOf(feature);
    if (idx !== -1) features.splice(idx, 1);
    // 从 VectorSource 移除
    if (vectorSource && vectorSource instanceof VectorSource) {
      vectorSource.removeFeature(feature);
    }
  });

  // 从 itemMap 移除
  removeFeatureFromItemMap(levelLogicId);
}

/**
 * 获取指定ID的特征
 * @private
 */
function getFeatureFromItemMap(
  levelLogicId: string | number
): Feature<Point> | undefined {
  const itemMap = getItemMap();
  return itemMap[Number(levelLogicId)];
}

/**
 * 从itemMap移除特征
 * @private
 */
function removeFeatureFromItemMap(levelLogicId: string | number): void {
  removeFeatureFromItemMapStore(Number(levelLogicId));
}

/**
 * 更新自定义标点标记
 * @param levelLogicId 逻辑ID
 * @param point 点数据
 */
export function updateCustomPointMarker(
  levelLogicId: string | number,
  point: PointData
): void {
  removeCustomPointMarker(levelLogicId);
  createCustomPointMarker(point);
}

/**
 * 清理自定义标点相关内容
 * @param types 类型
 */
export function clearCustomPointsOnMap(types = customPointTypes) {
  const features = getFeatures();
  // 使用一个Set来存储类型以便快速查找
  const typeSet = new Set(types);

  // 收集要删除的features
  const featuresToRemove: Feature<Point>[] = [];
  const logicIdsToRemove: (string | number)[] = [];

  // 按类型筛选要删除的特征
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const payload = feature.get('payload');
    const entityType = payload?.entityDataIdKey;

    if (entityType && typeSet.has(entityType)) {
      featuresToRemove.push(feature);
      if (payload.levelLogicId) {
        logicIdsToRemove.push(payload.levelLogicId);
      }
    }
  }

  // 批量删除特征
  featuresToRemove.forEach(feature => {
    removeCustomPointMarker(feature.get('payload').levelLogicId);
  });

  // 清理entityGroup
  const entityGroup = getEntityGroup();
  types.forEach(type => {
    if (entityGroup[type]) entityGroup[type].points = [];
  });
}

/**
 * 重置所有实体类型的计数
 */
export function resetEntityInfoCount() {
  Object.keys(entityInfo).forEach(key => {
    if (entityInfo[key]?.entityInfo) entityInfo[key].entityInfo.count = 0;
  });
}

/**
 * 根据点位更新实体类型计数
 * @param points 点位
 */
export function updateEntityInfoCount(points: PointData[]) {
  // 创建临时计数对象，避免频繁更新entityInfo
  const countMap: Record<string, number> = {};

  // 统计每种类型的数量
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const type = point.entityDataIdKey;

    if (entityInfo[type]?.entityInfo) {
      countMap[type] = (countMap[type] || 0) + 1;
    }
  }

  // 一次性更新entityInfo
  Object.entries(countMap).forEach(([type, count]) => {
    if (entityInfo[type]?.entityInfo) {
      entityInfo[type].entityInfo.count += count;
    }
  });
}
