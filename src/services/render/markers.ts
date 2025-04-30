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
  removeFeature,
  source,
  removeFeatureFromItemMap as removeFeatureFromItemMapStore,
  getEntityGroup,
  getStore,
} from './store';

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
  const countMap: Record<string, number> = {};
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const type = point.entityDataIdKey;
    if (entityInfo[type]?.entityInfo) {
      countMap[type] = (countMap[type] || 0) + 1;
    }
  }
  Object.entries(countMap).forEach(([type, count]) => {
    if (entityInfo[type]?.entityInfo) {
      entityInfo[type].entityInfo.count += count;
    }
  });
}

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
  addFeatureToItemMap(point.levelLogicId.toString(), feature);

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
  const idAsString = levelLogicId.toString();
  const itemMap = getItemMap();
  const featureFromMap = itemMap[idAsString];
  const toRemove: Feature<Point>[] = [];

  if (featureFromMap) {
    toRemove.push(featureFromMap);
  } else {
    const storeFeatures = getFeatures();
    const foundFeature = storeFeatures.find(
      f => f.get('payload')?.levelLogicId?.toString() === idAsString
    );
    if (foundFeature) {
      toRemove.push(foundFeature);
    }
  }

  if (toRemove.length === 0) {
    console.warn(`No feature found to remove for ID: ${idAsString}`);
    return;
  }

  const vectorSource = source.getSource();
  toRemove.forEach(feature => {
    removeFeature(feature);

    if (vectorSource && vectorSource instanceof VectorSource) {
      try {
        vectorSource.removeFeature(feature);
        console.log('Feature removed from vectorSource');
      } catch (e) {
        console.warn(
          'Error removing feature from vectorSource (might be already removed): ',
          e
        );
      }
    }
  });

  removeFeatureFromItemMapStore(idAsString);
  console.log(`Feature removed from itemMap for ID: ${idAsString}`);
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
  const idAsString = levelLogicId.toString();
  const currentFeature = getItemMap()[idAsString];

  if (
    currentFeature &&
    currentFeature.get('payload')?.entityDataIdKey === point.entityDataIdKey
  ) {
    currentFeature.set('payload', point);
    console.log(`Updated payload for feature ID: ${idAsString}`);
    currentFeature.changed();

    const statePoint = require('../map/state').point;
    if (statePoint.value?.levelLogicId?.toString() === idAsString) {
      statePoint.value = point;
      const popupMgr = require('../map/state').popupManager.value;
      if (popupMgr?.isPopupVisible.value) {
        popupMgr.setCurrentPosition(xyz2crd(point.position));
        popupMgr.adjustPopupPosition();
      }
    }
  } else {
    removeCustomPointMarker(idAsString);
    createCustomPointMarker(point);
    console.log(`Recreated feature ID: ${idAsString}`);
  }
}

/**
 * 清理自定义标点相关内容
 * @param types 类型
 */
export function clearCustomPointsOnMap(types = customPointTypes) {
  const features = getFeatures();
  const typeSet = new Set(types);
  const featuresToRemove: Feature<Point>[] = [];

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const payload = feature.get('payload');
    const entityType = payload?.entityDataIdKey;
    if (entityType && typeSet.has(entityType)) {
      featuresToRemove.push(feature);
    }
  }

  featuresToRemove.forEach(feature => {
    removeCustomPointMarker(feature.get('payload').levelLogicId);
  });

  const entityGroup = getEntityGroup();
  types.forEach(type => {
    if (entityGroup[type]) entityGroup[type].points = [];
  });
}

/**
 * @description 根据点位数据填充 features 数组和 itemMap
 * @param points 要处理的点位数据数组
 */
export function populateFeaturesFromPoints(points: PointData[]): void {
  const store = getStore();
  store.features.length = 0;
  Object.keys(store.itemMap).forEach(key => delete store.itemMap[key]);

  const vectorSource = source.getSource();

  if (vectorSource && vectorSource instanceof VectorSource) {
    vectorSource.clear();
  } else {
    console.error(
      'populateFeaturesFromPoints: Failed to get VectorSource from WebGLVectorLayer'
    );
    return;
  }

  resetEntityInfoCount();

  console.log(`Populating features for ${points.length} points...`);

  let skippedCount = 0; // 记录跳过的点位数量
  points.forEach(point => {
    const feature = marker(point);
    if (feature) {
      addFeature(feature);
      addFeatureToItemMap(point.levelLogicId.toString(), feature);
      vectorSource.addFeature(feature);
    } else {
      // 修改点：仅记录警告，然后继续处理下一个点
      console.warn(`Skipping point due to missing entityInfo:`, point);
      skippedCount++;
    }
  });

  updateEntityInfoCount(points.filter(p => !!entityInfo[p.entityDataIdKey])); // 只计算有效的点位
  console.log(
    `Features populated. Processed: ${points.length}, Added: ${
      getFeatures().length
    }, Skipped: ${skippedCount}, itemMap size: ${
      Object.keys(getItemMap()).length
    }`
  );
}
