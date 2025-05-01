import { watch } from 'vue';
import { loadJSON } from '@/utils/jsonLoader';
import {
  customEntityInfo,
  customPointTypes,
  entityInfo,
  entityShowStates,
  initializeEntityShowStates,
} from '@/data/entity';
import { getCurrentPoints } from '@/services/points';
import type { PointData } from '@/types/points';
import {
  getFeatures,
  getSource,
  addFeature,
  addFeatureToItemMap,
  addFeatureToEntityGroup,
  clearAllData,
  marker,
  createEntityClusterLayers,
} from '@/services/render';
import type { EntityCategories } from '@/types/entity';
import { currentMarkFilter } from '@/data/marks';
import { pubsub, EVENTS } from './pubsub';

// 获取entity数据
export const getEntityDataByKey = (key: string) => {
  return entityInfo[key];
};

export const getEntityDataByPic = (pic: string) => {
  const result = Object.keys(entityInfo).find(key => {
    const entity = entityInfo[key];
    return entity.entityInfo.pic === pic;
  });
  return result ? entityInfo[result] : null;
};

// 获取实体类型对应的点位集合
export const getPointsByEntityType = async (
  entityType: string
): Promise<PointData[]> => {
  const currentPoints = await getCurrentPoints();
  return currentPoints.filter(point => point.entityDataIdKey === entityType);
};

// 初始化地图
export async function initializeEntity() {
  try {
    await loadEntityData(); // 先加载实体数据
    const currentPoints = await getCurrentPoints(); // 使用导入的获取当前点位的函数
    await initializeEntityInfo(currentPoints); // 使用当前点位数组
    await initializeEntityShowStates(); // 初始化实体显示状态
    createEntityClusterLayers(); // 最后创建图层
  } catch (error) {
    console.error('初始化地图失败:', error);
    throw error;
  }
  // 监听标记筛选状态变化，刷新地图
  watch(currentMarkFilter, () => {
    notifySelectChange();
  });
}

// 初始化实体信息
export async function initializeEntityInfo(pointsData: PointData[]) {
  // 参数检查
  if (!pointsData || !Array.isArray(pointsData)) {
    console.error('初始化实体信息失败: points 参数无效', pointsData);
    return;
  }

  // 确保entityInfo已经加载
  if (Object.keys(entityInfo).length === 0) {
    try {
      await loadEntityData();
    } catch (error) {
      console.error('加载实体数据失败:', error);
      return;
    }
  }

  try {
    console.log('开始初始化实体信息，点位数量:', pointsData.length);

    // 清空现有数据
    clearAllData();

    // 重置所有实体的计数
    Object.keys(entityInfo).forEach(key => {
      if (entityInfo[key]) {
        entityInfo[key].entityInfo.count = 0;
      }
    });

    // 处理每个点位
    for (const point of pointsData) {
      // 更新entityInfo计数
      if (entityInfo[point.entityDataIdKey]?.entityInfo) {
        entityInfo[point.entityDataIdKey].entityInfo.count++;
      }

      // 创建并添加feature
      const feature = marker(point);
      if (feature) {
        addFeature(feature);
        addFeatureToItemMap(point.levelLogicId, feature);
        addFeatureToEntityGroup(
          point.entityDataIdKey,
          feature,
          point.entityDataIdKey
        );
      }
    }

    // 将features添加到source中
    const vectorSource = getSource().getSource();
    if (vectorSource) {
      vectorSource.addFeatures(getFeatures());
    }

    console.log(`成功初始化 ${getFeatures().length} 个实体特征`);

    // 默认隐藏所有实体
    Object.keys(entityInfo).forEach(key => {
      entityShowStates[key] = false;
    });

    // 特殊处理：确保自定义标点类型默认为显示状态
    customPointTypes.forEach(type => {
      entityShowStates[type] = true;
    });
  } catch (error) {
    console.error('初始化实体信息时发生错误:', error);
    throw error;
  }
}

// 加载实体数据
export async function loadEntityData() {
  try {
    const data = await loadJSON<EntityCategories>('/data/entity.json');
    // 清空当前数据
    Object.keys(entityInfo).forEach(key => {
      delete entityInfo[key];
    });

    // 添加新数据
    Object.entries(data).forEach(([key, value]) => {
      entityInfo[key] = value;
    });
    // 添加自定义实体
    Object.entries(customEntityInfo).forEach(([key, value]) => {
      entityInfo[key] = value;
    });
    return entityInfo;
  } catch (error) {
    console.error('加载实体数据失败:', error);
    throw error;
  }
}

// 重新初始化实体图层
export const initializeEntityLayers = async () => {
  // 保存原有的显示状态
  const showStates = Object.fromEntries(
    Object.entries(entityInfo).map(([key]) => [key, entityShowStates[key]])
  );

  // 使用clearAllData函数替代多个循环清理
  clearAllData();

  try {
    // 重新初始化实体信息
    const currentPoints = await getCurrentPoints();
    await initializeEntityInfo(currentPoints);

    // 恢复显示状态（只针对新地图中存在的实体）
    for (const key in entityInfo) {
      if (entityInfo[key].entityInfo && showStates[key] !== undefined) {
        entityShowStates[key] = showStates[key];
      }
    }

    // 重新创建聚合图层
    createEntityClusterLayers();
  } catch (error) {
    console.error('重新初始化实体图层失败:', error);
    throw error;
  }
};

export const isCustomEntity = (key: string) => {
  return Object.keys(customEntityInfo).includes(key);
};

// 选择所有实体
export const selectAll = () => {
  Object.keys(entityInfo).forEach(key => {
    entityShowStates[key] = true;
  });
  notifySelectChange();
};

// 清除所有选择
export const clear = () => {
  Object.keys(entityInfo).forEach(key => {
    entityShowStates[key] = false;
  });
  notifySelectChange();
};

export const select = (...keys: string[]) => {
  keys.forEach(key => {
    if (entityInfo[key]) {
      entityShowStates[key] = true;
    }
  });
  notifySelectChange();
};

export const unSelect = (...keys: string[]) => {
  keys.forEach(key => {
    if (entityInfo[key]) {
      entityShowStates[key] = false;
    }
  });
  notifySelectChange();
};

export const toggleSelect = (...keys: string[]) => {
  keys.forEach(key => {
    if (entityInfo[key]) {
      entityShowStates[key] = !entityShowStates[key];
    }
  });
  notifySelectChange();
};

// 选择一大类的实体
export const selectByCategory = (category: string) => {
  Object.keys(entityInfo).forEach(key => {
    if (entityInfo[key].category === category) {
      entityShowStates[key] = true;
    }
  });
  notifySelectChange();
};

// 取消选择一大类的实体
export const unSelectByCategory = (category: string) => {
  Object.keys(entityInfo).forEach(key => {
    if (entityInfo[key].category === category) {
      entityShowStates[key] = false;
    }
  });
  notifySelectChange();
};

export const selectAllByCategory = (category: string) => {
  Object.keys(entityInfo).forEach(key => {
    if (entityInfo[key].category === category) {
      entityShowStates[key] = true;
    }
  });
  notifySelectChange();
};

export const unSelectAllByCategory = (category: string) => {
  Object.keys(entityInfo).forEach(key => {
    if (entityInfo[key].category === category) {
      entityShowStates[key] = false;
    }
  });
  notifySelectChange();
};

// 切换选择一大类的实体
export const toggleSelectByCategory = (category: string) => {
  Object.keys(entityInfo).forEach(key => {
    if (entityInfo[key].category === category) {
      entityShowStates[key] = !entityShowStates[key];
    }
  });
  notifySelectChange();
};

// 通知选择变更
const notifySelectChange = () => {
  pubsub.publish(EVENTS.SELECT_CHANGE);
};
