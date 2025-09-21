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
  electricPoleRangeLayer,
} from '@/services/render/store';
import settings from '@/data/settings';
import { EVENTS, pubsub } from '@/services/pubsub';
import {
  getPoleRangeRadius,
} from '@/services/electricPoleConnector';
import { watch } from 'vue';
import { entityShowStates } from '@/data/entity';
import { popupManager, point } from '@/services/map';
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
  addFeatureToEntityGroup(entityType, feature, info.entityInfo.point);

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

  // 如果是电线杆，则创建其范围
  if (point.entityDataIdKey === 'electric_pole') {
    updateElectricPoleRange(point);
  }

  return feature;
}

/**
 * 创建电线杆范围Feature
 * @param point 电线杆点数据
 */
export function updateElectricPoleRange(point: PointData): void {
  const poleId = point.levelLogicId;
  const radius = getPoleRangeRadius(point);

  const rangeSource = electricPoleRangeLayer.getSource() as VectorSource<Feature<Point>> | null;
  if (!rangeSource) {
    console.warn('无法获取电线杆范围层的VectorSource');
    return;
  }

  const existingFeature = findRangeFeatureByPoleId(poleId);

  if (radius > 0) {
    if (existingFeature) {
      // 更新现有Feature
      const payload = existingFeature.get('payload');
      if (payload.radius !== radius) {
        existingFeature.set('payload', { ...payload, radius });
        // console.log(`更新电线杆 ${poleId} 的范围半径为 ${radius}`);
      }
    } else {
      // 创建新的Feature
      const rangeFeature = new Feature({
        geometry: new Point(xyz2crd(point.position)),
        payload: { ...point, isRange: true, radius },
      });
      rangeSource.addFeature(rangeFeature);
      // console.log(`为电线杆 ${poleId} 创建了新的范围，半径为 ${radius}`);
    }
  } else {
    // 如果半径为0，则移除范围
    if (existingFeature) {
      rangeSource.removeFeature(existingFeature);
      // console.log(`移除了电线杆 ${poleId} 的范围`);
    }
  }
}

/**
 * 根据电线杆ID查找范围Feature
 * @param poleId 电线杆ID
 */
function findRangeFeatureByPoleId(poleId: string | number): Feature<Point> | undefined {
  const rangeSource = electricPoleRangeLayer.getSource() as VectorSource<Feature<Point>> | null;
  if (!rangeSource) return undefined;

  const features = rangeSource.getFeatures();
  return features.find(f => f.get('payload')?.levelLogicId === poleId);
}

/**
 * 删除电线杆范围Feature
 * @param levelLogicId 电线杆ID
 */
function removeElectricPoleRangeFeature(levelLogicId: string | number): void {
  const rangeSource = electricPoleRangeLayer.getSource() as VectorSource<Feature<Point>> | null;
  if (rangeSource) {
    const rangeFeature = findRangeFeatureByPoleId(levelLogicId);
    if (rangeFeature) {
      try {
        rangeSource.removeFeature(rangeFeature);
        console.log(`移除了电线杆 ${levelLogicId} 的范围Feature`);
      } catch (e) {
        console.warn(`移除范围Feature ${levelLogicId} 时出错:`, e);
      }
    }
  }
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

  // 删除对应的范围Feature
  removeElectricPoleRangeFeature(idAsString);
}

/**
 * 更新自定义标点标记
 * @param levelLogicId 逻辑ID
 * @param pointData 点数据
 */
export function updateCustomPointMarker(
  levelLogicId: string | number,
  pointData: PointData
): void {
  const idAsString = levelLogicId.toString();
  const currentFeature = getItemMap()[idAsString];

  if (
    currentFeature &&
    currentFeature.get('payload')?.entityDataIdKey === pointData.entityDataIdKey
  ) {
    currentFeature.set('payload', point);
    console.log(`Updated payload for feature ID: ${idAsString}`);
    currentFeature.changed();

    if (point.value?.levelLogicId?.toString() === idAsString) {
      point.value = pointData;
      const popupMgr = popupManager.value;
      if (popupMgr?.isPopupVisible.value) {
        popupMgr.setCurrentPosition(xyz2crd(pointData.position));
        popupMgr.adjustPopupPosition();
      }
    }
  } else {
    removeCustomPointMarker(idAsString);
    createCustomPointMarker(pointData);
    console.log(`Recreated feature ID: ${idAsString}`);
  }

  // 如果是电线杆，触发一次范围更新检查
  if (pointData.entityDataIdKey === 'electric_pole') {
    updateElectricPoleRange(pointData);
  }
}

/**
 * 更新电线杆范围Feature
 * @param point 电线杆点数据
 */
// 订阅电线杆连接变更事件
pubsub.subscribe(EVENTS.POLE_CONNECTION_CHANGED, (poleIds) => {
  // console.log('接收到 pole-connection-changed 事件, poleIds:', poleIds);
  const uniqueIds = [...new Set(poleIds)]; // 去重
  const itemMap = getItemMap();
  uniqueIds.forEach(id => {
    const feature = itemMap[id];
    if (feature) {
      const point = feature.get('payload') as PointData;
      if (point && point.entityDataIdKey === 'electric_pole') {
        updateElectricPoleRange(point);
      }
    } else {
      // 如果点在itemMap中不存在（可能已被删除），确保其范围也被删除
      removeElectricPoleRangeFeature(id);
    }
  });
});

// 监听范围显示设置的变化
watch(
  [() => settings.value.showElectricPoleRange, () => entityShowStates['electric_pole']],
  ([showRange, showPole]) => {
    const isVisible = showRange && showPole;
    console.log(`电线杆范围可见性设置更改为: ${isVisible}`);
    electricPoleRangeLayer.setVisible(isVisible);

    if (isVisible) {
      // 当开启显示时，强制刷新所有电线杆的范围
      console.log('范围显示已开启，强制刷新所有电线杆的范围');
      const itemMap = getItemMap();
      for (const id in itemMap) {
        const feature = itemMap[id];
        const point = feature.get('payload') as PointData;
        if (point && point.entityDataIdKey === 'electric_pole') {
          updateElectricPoleRange(point);
        }
      }
    } else {
      // 当关闭显示时，清空范围图层的源，以节省资源
      const rangeSource = electricPoleRangeLayer.getSource() as VectorSource<Feature<Point>> | null;
      if (rangeSource) {
        rangeSource.clear();
        console.log('范围显示已关闭，已清空范围图层');
      }
    }
  }
);

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
