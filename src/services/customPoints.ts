import type { CustomPointDataType, PointData } from '@/types/points';
import { getItem, setItem } from '@/utils/indexedDBStorage';
import { DATA_DB_KEY } from '@/constants/db_key';
import { StorageType } from '@/utils/indexedDBStorage';
import type { Coordinate } from 'ol/coordinate';
import { generateUUID, crd2xyz, xyz2crd } from '@/utils/common';
import { getCurrentMapId, closePopup, point, popupManager } from './map';
import { filterAndUpdatePoints, getCurrentPoints } from './points';
import {
  getItemMap,
  refreshMap,
  createCustomPointMarker,
  removeCustomPointMarker,
  updateCustomPointMarker,
  clearCustomPointsOnMap,
  populateFeaturesFromPoints,
} from './render';
import { marks } from '@/data/marks';
import { customPointTypes, entityInfo } from '@/data/entity';
import { select } from './entity';
import { removeConnectionsForPoint } from './electricPoleConnector';
import type { CustomPointKey } from '@/types/customPoints';

const DB_ALL_POINTS_KEY = DATA_DB_KEY.CUSTOM_POINTS;
const DB_ALL_POINTS_DATA_KEY = DATA_DB_KEY.CUSTOM_POINTS_DATA;

/**
 * 获取所有自定义标点
 * @returns 自定义标点数组
 */
export async function getCustomPoints(): Promise<PointData[]> {
  const customPoints =
    (await getItem<PointData[]>(DB_ALL_POINTS_KEY, StorageType.PERMANENT)) ||
    [];
  return customPoints;
}

/**
 * 获取所有自定义标点数据
 * @returns 自定义标点数据
 */
export async function getAllCustomPointsData(): Promise<CustomPointDataType> {
  const customPointsData =
    (await getItem<CustomPointDataType>(
      DB_ALL_POINTS_DATA_KEY,
      StorageType.PERMANENT
    )) || {};
  return customPointsData;
}

/**
 * 获取自定义标点数据
 * @param id 自定义标点ID
 * @returns 自定义标点数据
 */
export async function getCustomPointData(id: string) {
  const customPointsData = await getAllCustomPointsData();
  return customPointsData[id] || null;
}

/**
 * 保存自定义标点数据
 * @param id 自定义标点ID
 * @param data 自定义标点数据
 */
export async function saveCustomPointData(
  id: string,
  data: CustomPointDataType[string]
): Promise<void> {
  const customPointsData = await getAllCustomPointsData();
  customPointsData[id] = data;
  await setItem(
    DB_ALL_POINTS_DATA_KEY,
    customPointsData,
    StorageType.PERMANENT
  );
}

/**
 * 保存自定义标点
 * @param points 自定义标点
 */
export async function saveCustomPoints(...points: PointData[]): Promise<void> {
  const customPoints = await getCustomPoints();
  const mergedPoints = [...customPoints, ...points];
  await setItem(DB_ALL_POINTS_KEY, mergedPoints, StorageType.PERMANENT);
}

/**
 * 创建自定义标点
 * @param coordinate 坐标
 * @param mapId 地图ID
 * @param type 标点类型，默认为普通自定义标点
 */
export async function createCustomPoint(
  coordinate: Coordinate,
  mapId: string,
  type: CustomPointKey = '1'
): Promise<void> {
  // 检查电线杆数量限制
  if (type === 'electric_pole') {
    const existingPoints = await getCustomPoints();
    const electricPoleCount = existingPoints.filter(p => p.entityDataIdKey === 'electric_pole').length;
    if (electricPoleCount >= 10) {
      console.warn('电线杆数量已达到上限（10个）');
      return;
    }
  }

  // 检查坐标是否重复（避免在同一位置创建重复的标点）
  // 注意：这里只检查主标点，不包括范围Feature
  const existingPoints = await getCustomPoints();
  const newPosition = crd2xyz(coordinate);
  const isDuplicate = existingPoints.some(point => {
    // 只检查主标点，不包括范围Feature
    if ((point as any).isRange) {
      return false;
    }
    // 使用小的容差范围来避免浮点数精度问题
    const tolerance = 0.1;
    const xDiff = Math.abs(point.position.x - newPosition.x);
    const zDiff = Math.abs(point.position.z - newPosition.z);
    if (xDiff < tolerance && zDiff < tolerance) {
      console.warn('该位置已存在标点，无法重复创建');
      return true;
    }
    return false;
  });

  if (isDuplicate) {
    return;
  }

  const finalMapId = mapId === 'map002' ? 'map02' : 'map01';
  const newPoint: PointData = {
    levelLogicId: generateUUID(),
    sceneId: finalMapId,
    position: crd2xyz(coordinate),
    entityDataIdKey: type,
  };

  // 保存到数据库
  await saveCustomPoints(newPoint);

  // 更新当前显示的点位集合
  await filterAndUpdatePoints(getCurrentMapId());

  // 创建新的标记并添加到地图
  createCustomPointMarker(newPoint);

  marks[newPoint.levelLogicId] = {
    finish: false,
  };

  // 从entityInfo中更新计数
  if (
    entityInfo[type] &&
    entityInfo[type].entityInfo
  ) {
    entityInfo[type].entityInfo.count++;
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
  const entityType = pointToDelete?.entityDataIdKey || customPointTypes[0];

  const updatedPoints = customPoints.filter(
    point => point.levelLogicId !== levelLogicId
  );
  await setItem(DB_ALL_POINTS_KEY, updatedPoints, StorageType.PERMANENT);

  // 更新当前显示的点位集合
  await filterAndUpdatePoints(getCurrentMapId());

  // 从地图中移除该标记
  removeCustomPointMarker(levelLogicId);

  // 从marks中删除
  if (marks[levelLogicId]) {
    delete marks[levelLogicId];
  }

  // 如果删除的是电线杆，删除所有相关的连线
  if (entityType === 'electric_pole') {
    await removeConnectionsForPoint(levelLogicId);
  }

  // 从entityInfo中更新计数
  if (entityInfo[entityType] && entityInfo[entityType].entityInfo) {
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
  let previousType = customPointTypes[0];
  const newType = data.entityDataIdKey || customPointTypes[0];

  // 保存更新后的点位数据，用于后续更新地图标记
  let updatedPoint: PointData | null = null;

  // 使用forEach更清晰地表达修改变量的意图
  const updatedPoints = [...customPoints]; // 创建副本以避免修改原数组

  // 查找并更新匹配的点位
  for (let i = 0; i < updatedPoints.length; i++) {
    if (updatedPoints[i].levelLogicId === levelLogicId) {
      updated = true;
      previousType = updatedPoints[i].entityDataIdKey as CustomPointKey;
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
    updateCustomPointMarker(levelLogicId, updatedPoint);
    // 确保该类型实体处于选中状态
    select(newType);
  } else if (updatedPoint) {
    // 如果类型没有改变但其他属性改变了，更新已有feature的payload
    const feature = getItemMap()[levelLogicId];
    if (feature) {
      feature.set('payload', updatedPoint);
    }
  }

  // 更新弹窗内容（如果当前显示的就是这个点位）
  if (updatedPoint && point.value?.levelLogicId === levelLogicId) {
    // 更新entity引用，这样弹窗会显示新的数据
    point.value = updatedPoint;

    // 如果弹窗管理器存在且当前正在显示弹窗，确保弹窗位置正确
    if (popupManager.value && popupManager.value.isPopupVisible.value) {
      // 设置当前位置，以便PopupManager可以正确重新定位弹窗
      popupManager.value.setCurrentPosition(xyz2crd(updatedPoint.position));
      // 重新定位弹窗
      popupManager.value.adjustPopupPosition();
    }
  }

  // 刷新地图渲染
  refreshMap();
}

/**
 * 判断是否为自定义标点
 * @param point 点位
 * @returns 是否为自定义标点
 */
export const isCustomPoint = (point: PointData): boolean => {
  return customPointTypes.includes(point.entityDataIdKey as CustomPointKey);
};

/**
 * 判断是否为自定义标点类型
 * @param type 类型
 * @returns 是否为自定义标点类型
 */
export const isCustomPointType = (type: string): boolean => {
  return customPointTypes.includes(type as CustomPointKey);
};

/**
 * 获取数据用于备份
 * @returns 备份数据
 */
export async function getBackupData(): Promise<{
  customPointsData: CustomPointDataType;
  customPoints: PointData[];
}> {
  const customPointsData = await getAllCustomPointsData();
  const customPoints = await getCustomPoints();
  return {
    customPointsData,
    customPoints,
  };
}

/**
 * 恢复备份数据(merge)
 * @param data 备份数据
 */
export async function restoreBackupData(data: {
  customPointsData: CustomPointDataType;
  customPoints: PointData[];
}): Promise<void> {
  clearCustomPointsOnMap();
  // 合并数据，遇到冲突以本地为主
  const localCustomPointsData = await getAllCustomPointsData();
  const localCustomPoints = await getCustomPoints();
  const localPointIds = new Set(localCustomPoints.map(p => p.levelLogicId));
  const mergedCustomPoints = [
    ...localCustomPoints,
    ...data.customPoints.filter(p => !localPointIds.has(p.levelLogicId)),
  ];
  const mergedCustomPointsData: CustomPointDataType = {
    ...localCustomPointsData,
  };
  Object.keys(data.customPointsData).forEach(id => {
    if (!(id in mergedCustomPointsData))
      mergedCustomPointsData[id] = data.customPointsData[id];
  });
  await setItem(
    DB_ALL_POINTS_DATA_KEY,
    mergedCustomPointsData,
    StorageType.PERMANENT
  );
  await setItem(DB_ALL_POINTS_KEY, mergedCustomPoints, StorageType.PERMANENT);
  await refreshPointsDisplay();
}

/**
 * 刷新标点显示
 * 更新点位集合并刷新地图渲染
 */
export async function refreshPointsDisplay(): Promise<void> {
  console.log('开始刷新标点显示...');

  // 1. 获取过滤后的当前地图点位 (包括从DB加载的自定义点位)
  await filterAndUpdatePoints(getCurrentMapId()); // 确保 currentPoints 更新
  const currentPoints = await getCurrentPoints();
  console.log('当前点位数量:', currentPoints.length);

  // 2. 使用这些点位数据填充渲染存储 (features, itemMap, map source)
  populateFeaturesFromPoints(currentPoints);

  // 3. 刷新地图渲染以显示聚合等效果
  refreshMap();
  console.log('标点显示刷新完成');
}

/**
 * 恢复备份数据(replace)
 * @param data 备份数据
 */
export async function restoreBackupDataReplace(data: {
  customPointsData: CustomPointDataType;
  customPoints: PointData[];
}): Promise<void> {
  console.log('开始恢复备份数据...');
  console.log('备份数据中的点位数量:', data.customPoints.length);
  const customPointsIds = new Set(
    data.customPoints.map(point => point.levelLogicId)
  );
  const invalidIds = Object.keys(data.customPointsData).filter(
    id => !customPointsIds.has(id)
  );
  if (invalidIds.length > 0) {
    throw new Error(
      '以下ID在customPointsData中存在但在customPoints中不存在:' +
        invalidIds.join(',')
    );
  }
  clearCustomPointsOnMap();
  const serializedCustomPointsData = JSON.parse(
    JSON.stringify(data.customPointsData)
  );
  const serializedCustomPoints = JSON.parse(JSON.stringify(data.customPoints));
  await setItem(
    DB_ALL_POINTS_DATA_KEY,
    serializedCustomPointsData,
    StorageType.PERMANENT
  );
  await setItem(
    DB_ALL_POINTS_KEY,
    serializedCustomPoints,
    StorageType.PERMANENT
  );
  console.log('数据已存储到 IndexedDB');
  const storedPoints = await getCustomPoints();
  console.log('从 IndexedDB 读取的点位数量:', storedPoints.length);
  await refreshPointsDisplay();
  console.log('备份数据恢复完成');
}

/**
 * 恢复标点（merge）
 */
export async function restorePointsMerge(
  customPoints: PointData[]
): Promise<void> {
  await setItem(DB_ALL_POINTS_KEY, customPoints, StorageType.PERMANENT);
  // 刷新标点显示
  await refreshPointsDisplay();
}

/**
 * 恢复标点（replace）
 */
export async function restorePointsReplace(
  customPoints: PointData[]
): Promise<void> {
  await setItem(DB_ALL_POINTS_KEY, customPoints, StorageType.PERMANENT);
  // 刷新标点显示
  await refreshPointsDisplay();
}
