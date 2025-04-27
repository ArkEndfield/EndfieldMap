import type { CustomPointDataType, PointData } from '@/types/points';
import { getItem, setItem } from '@/utils/indexedDBStorage';
import { DATA_DB_KEY } from '@/constants/db_key';
import { StorageType } from '@/utils/indexedDBStorage';
import type { Coordinate } from 'ol/coordinate';
import { generateUUID, crd2xyz, xyz2crd } from '@/utils/common';
import { getCurrentMapId, closePopup, entity, popupManager } from './MapCore';
import { filterAndUpdatePoints, getCurrentPoints } from './points';
import {
  getItemMap,
  getFeatures,
  getSource,
  refreshMap,
  marker,
  addFeature,
  addFeatureToItemMap,
  removeFeatureFromItemMap,
  createCustomPointMarker,
  removeCustomPointMarker,
  updateCustomPointMarker,
  getEntityGroup,
} from './render';
import { marks } from '@/data/marks';
import { entityInfo } from '@/data/entity';
import { select } from './entity';
import VectorSource from 'ol/source/Vector';

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
  createCustomPointMarker(newPoint);

  marks[newPoint.levelLogicId] = {
    finish: false,
  };

  // 从entityInfo中更新计数
  if (entityInfo['custom'] && entityInfo['custom'].entityInfo) {
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
  removeCustomPointMarker(levelLogicId);

  // 从marks中删除
  if (marks[levelLogicId]) {
    delete marks[levelLogicId];
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
  if (updatedPoint && entity.value?.levelLogicId === levelLogicId) {
    // 更新entity引用，这样弹窗会显示新的数据
    entity.value = updatedPoint;

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
  return ['custom', 'custom1', 'custom2'].includes(point.entityDataIdKey);
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
  // 1. 图层处理，清理自定义标点相关内容（同 restoreBackupDataReplace）
  ['custom', 'custom1', 'custom2'].forEach(type => {
    // 移除 features
    getFeatures()
      .filter(f => f.get('payload')?.entityDataIdKey === type)
      .forEach(f => removeCustomPointMarker(f.get('payload').levelLogicId));
    // 清空 entityGroup
    const group = getEntityGroup();
    if (group[type]) {
      group[type].points = [];
    }
    // 清空 itemMap
    const itemMap = getItemMap();
    Object.keys(itemMap).forEach(key => {
      const f = itemMap[key];
      if (f.get('payload')?.entityDataIdKey === type) {
        removeFeatureFromItemMap(Number(key));
      }
    });
  });

  // 2. 合并数据，遇到冲突以本地为主
  const localCustomPointsData = await getAllCustomPointsData();
  const localCustomPoints = await getCustomPoints();
  const localPointIds = new Set(localCustomPoints.map(p => p.levelLogicId));

  // 合并 customPoints：本地为主，导入数据只添加本地没有的点
  const mergedCustomPoints = [
    ...localCustomPoints,
    ...data.customPoints.filter(p => !localPointIds.has(p.levelLogicId)),
  ];

  // 合并 customPointsData：本地为主，导入数据只添加本地没有的id
  const mergedCustomPointsData: CustomPointDataType = {
    ...localCustomPointsData,
  };
  Object.keys(data.customPointsData).forEach(id => {
    if (!(id in mergedCustomPointsData)) {
      mergedCustomPointsData[id] = data.customPointsData[id];
    }
  });

  // 3. 存储合并后的数据
  await setItem(
    DB_ALL_POINTS_DATA_KEY,
    mergedCustomPointsData,
    StorageType.PERMANENT
  );
  await setItem(DB_ALL_POINTS_KEY, mergedCustomPoints, StorageType.PERMANENT);

  // 4. 刷新标点显示
  await refreshPointsDisplay();
}

/**
 * 刷新标点显示
 * 更新点位集合并刷新地图渲染
 */
export async function refreshPointsDisplay(): Promise<void> {
  console.log('开始刷新标点显示...');

  // 清除现有的标记
  const vectorSource = getSource().getSource();
  if (vectorSource && vectorSource instanceof VectorSource) {
    vectorSource.clear();
  } else {
    console.error('source.getSource() is not an instance of VectorSource');
  }
  getFeatures().length = 0;
  Object.keys(getItemMap()).forEach(key => {
    removeFeatureFromItemMap(Number(key));
  });

  // 更新当前显示的点位集合
  await filterAndUpdatePoints(getCurrentMapId());

  // 重新加载所有标记
  const currentPoints = await getCurrentPoints();
  console.log('当前点位数量:', currentPoints.length);

  // 重置所有实体类型的计数
  Object.keys(entityInfo).forEach(key => {
    if (entityInfo[key] && entityInfo[key].entityInfo) {
      entityInfo[key].entityInfo.count = 0;
    }
  });

  // 更新实体类型的计数
  currentPoints.forEach(point => {
    const feature = marker(point);
    if (feature) {
      addFeature(feature);
      addFeatureToItemMap(Number(point.levelLogicId), feature);
      const vectorSource = getSource().getSource();
      if (vectorSource && vectorSource instanceof VectorSource) {
        vectorSource.addFeature(feature);
      } else {
        console.error('source.getSource() is not an instance of VectorSource');
      }

      // 更新计数
      if (
        entityInfo[point.entityDataIdKey] &&
        entityInfo[point.entityDataIdKey].entityInfo
      ) {
        entityInfo[point.entityDataIdKey].entityInfo.count++;
      }
    }
  });

  // 刷新地图渲染
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

  // 验证数据
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

  // 1. 清空所有自定义标点（features、itemMap、entityGroup、地图上的相关 feature）
  // 只清理自定义标点相关内容
  ['custom', 'custom1', 'custom2'].forEach(type => {
    // 移除 features
    getFeatures()
      .filter(f => f.get('payload')?.entityDataIdKey === type)
      .forEach(f => removeCustomPointMarker(f.get('payload').levelLogicId));
    // 清空 entityGroup
    const group = getEntityGroup();
    if (group[type]) {
      group[type].points = [];
    }
    // 清空 itemMap
    const itemMap = getItemMap();
    Object.keys(itemMap).forEach(key => {
      const f = itemMap[key];
      if (f.get('payload')?.entityDataIdKey === type) {
        removeFeatureFromItemMap(Number(key));
      }
    });
  });

  // 序列化数据以移除循环引用
  const serializedCustomPointsData = JSON.parse(
    JSON.stringify(data.customPointsData)
  );
  const serializedCustomPoints = JSON.parse(JSON.stringify(data.customPoints));

  // 存储数据
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

  // 验证数据是否存储成功
  const storedPoints = await getCustomPoints();
  console.log('从 IndexedDB 读取的点位数量:', storedPoints.length);

  // 刷新标点显示
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
