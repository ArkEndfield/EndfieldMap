import type { PointData } from '@/types/points';
import { getItem, setItem } from '@/utils/indexedDBStorage';
import { DATA_DB_KEY } from '@/constants/db_key';
import { StorageType } from '@/utils/indexedDBStorage';
import type { Coordinate } from 'ol/coordinate';
import { generateUUID, crd2xyz, xyz2crd } from '@/utils/common';
import {
  refreshMap,
  getCurrentMapId,
  closePopup,
  entity,
  popupManager,
} from './MapCore';
import { filterAndUpdatePoints } from './points';
import { itemMap, features, source } from './render';
import { marker } from './render';
import { marks } from '@/data/marks';
import { entityInfo } from '@/data/entity';
import { select } from './entity';

const DB_ALL_POINTS_KEY = DATA_DB_KEY.CUSTOM_POINTS;

export async function getCustomPoints(): Promise<PointData[]> {
  const customPoints =
    (await getItem<PointData[]>(DB_ALL_POINTS_KEY, StorageType.PERMANENT)) ||
    [];
  return customPoints;
}

export async function saveCustomPoints(...points: PointData[]): Promise<void> {
  const customPoints = await getCustomPoints();
  const mergedPoints = [...customPoints, ...points];
  await setItem(DB_ALL_POINTS_KEY, mergedPoints, StorageType.PERMANENT);
}

/**
 * 创建自定义标点
 * @param coordinate 坐标
 * @param mapId 地图ID
 */
export async function createCustomPoint(
  coordinate: Coordinate,
  mapId: string
): Promise<void> {
  const finalMapId = mapId === 'map002' ? 'map02' : 'map01';
  const newPoint: PointData = {
    levelLogicId: generateUUID(),
    sceneId: finalMapId,
    position: crd2xyz(coordinate),
    entityDataIdKey: 'custom',
  };

  // 保存到数据库
  await saveCustomPoints(newPoint);

  // 更新当前显示的点位集合
  await filterAndUpdatePoints(getCurrentMapId());

  // 创建新的标记并添加到地图
  const feature = marker(newPoint);
  if (feature) {
    features.push(feature);
    itemMap[newPoint.levelLogicId] = feature;
    source.addFeature(feature);
  }

  marks[newPoint.levelLogicId] = {
    finish: false,
  };

  // 更新entityInfo中的计数

  // 从entityInfo中更新计数
  if (entityInfo['custom'] && entityInfo['custom'].entityInfo) {
    // 增加计数，不需要检查是否大于0，因为是新增
    entityInfo['custom'].entityInfo.count++;
  }

  // 激活自定义实体的显示
  select(newPoint.entityDataIdKey);

  // 刷新地图渲染
  refreshMap();
}

/**
 * 删除自定义标点
 * @param levelLogicId 标点ID
 */
export async function deleteCustomPoint(
  levelLogicId: string | number
): Promise<void> {
  closePopup();
  // 从数据库中删除
  const customPoints = await getCustomPoints();

  // 在删除前记录点位类型，用于更新计数
  const pointToDelete = customPoints.find(
    point => point.levelLogicId === levelLogicId
  );
  const entityType = pointToDelete?.entityDataIdKey || 'custom';

  const updatedPoints = customPoints.filter(
    point => point.levelLogicId !== levelLogicId
  );
  await setItem(DB_ALL_POINTS_KEY, updatedPoints, StorageType.PERMANENT);

  // 更新当前显示的点位集合
  await filterAndUpdatePoints(getCurrentMapId());

  // 从地图中移除该标记
  const feature = itemMap[levelLogicId];
  if (feature) {
    source.removeFeature(feature);
    delete itemMap[levelLogicId];

    // 从features数组中移除
    const index = features.findIndex(f => f === feature);
    if (index !== -1) {
      features.splice(index, 1);
    }
  }

  // 从marks中删除
  if (marks[levelLogicId]) {
    delete marks[levelLogicId];
  }

  // 从entityInfo中更新计数
  if (entityInfo[entityType] && entityInfo[entityType].entityInfo) {
    // 确保不会出现负数
    if (entityInfo[entityType].entityInfo.count > 0) {
      entityInfo[entityType].entityInfo.count--;
    }
  }

  // 刷新地图渲染并通知更新
  refreshMap();
}

/**
 * 更新自定义标点坐标
 * @param levelLogicId 标点ID
 * @param data 要更新的标点数据
 */
export async function updateCustomPoint(
  levelLogicId: string | number,
  data: Partial<PointData>
): Promise<void> {
  // 更新数据库中的点位
  const customPoints = await getCustomPoints();
  let updated = false;
  let previousType = 'custom';
  const newType = data.entityDataIdKey || 'custom';

  // 保存更新后的点位数据，用于后续更新地图标记
  let updatedPoint: PointData | null = null;

  // 使用forEach更清晰地表达修改变量的意图
  const updatedPoints = [...customPoints]; // 创建副本以避免修改原数组

  // 查找并更新匹配的点位
  for (let i = 0; i < updatedPoints.length; i++) {
    if (updatedPoints[i].levelLogicId === levelLogicId) {
      updated = true;
      previousType = updatedPoints[i].entityDataIdKey;
      const newPoint = {
        ...updatedPoints[i],
        ...data,
      };
      updatedPoint = newPoint;
      updatedPoints[i] = newPoint; // 在新数组中更新点位
    }
  }

  if (!updated) return;

  await setItem(DB_ALL_POINTS_KEY, updatedPoints, StorageType.PERMANENT);

  // 更新当前显示的点位集合
  await filterAndUpdatePoints(getCurrentMapId());

  // 从entityInfo中更新计数(先前的减，现在的加)
  if (entityInfo[previousType] && entityInfo[previousType].entityInfo) {
    if (entityInfo[previousType].entityInfo.count > 0) {
      entityInfo[previousType].entityInfo.count--;
    }
  }
  if (entityInfo[newType] && entityInfo[newType].entityInfo) {
    entityInfo[newType].entityInfo.count++;
  }

  // 更新地图上对应的标记Feature
  if (updatedPoint && data.entityDataIdKey && previousType !== newType) {
    // 从地图中删除旧标记
    const feature = itemMap[levelLogicId];
    if (feature) {
      source.removeFeature(feature);

      // 从features数组中移除
      const index = features.findIndex(f => f === feature);
      if (index !== -1) {
        features.splice(index, 1);
      }

      // 删除旧的映射关系
      delete itemMap[levelLogicId];
    }

    // 创建新的标记并添加到地图
    const newFeature = marker(updatedPoint);
    if (newFeature) {
      features.push(newFeature);
      itemMap[levelLogicId] = newFeature;
      source.addFeature(newFeature);
    }

    // 确保该类型实体处于选中状态
    select(newType);
  } else if (updatedPoint) {
    // 如果类型没有改变但其他属性改变了，更新已有feature的payload
    const feature = itemMap[levelLogicId];
    if (feature) {
      feature.set('payload', updatedPoint);
    }
  }

  // 更新弹窗内容（如果当前显示的就是这个点位）
  if (updatedPoint && entity.value?.levelLogicId === levelLogicId) {
    // 更新entity引用，这样弹窗会显示新的数据
    entity.value = updatedPoint;

    // 如果弹窗管理器存在且当前正在显示弹窗，确保弹窗位置正确
    if (popupManager.value && popupManager.value.isPopupVisible.value) {
      // 设置当前位置，以便PopupManager可以正确重新定位弹窗
      popupManager.value.setCurrentPosition(xyz2crd(updatedPoint.position));
      // 重新定位弹窗
      popupManager.value.repositionPopup();
    }
  }

  // 刷新地图渲染
  refreshMap();
}

export const isCustomPoint = (point: PointData): boolean => {
  return ['custom', 'custom1', 'custom2'].includes(point.entityDataIdKey);
};
