import { watch } from 'vue';
import { loadJSON } from '@/utils/jsonLoader';
import { entityInfo, selectCallbacks } from '@/data/entity';
import { getCurrentPoints } from '@/services/points';
import type { PointData } from '@/types/points';
import {
  features,
  itemMap,
  entityGroup,
  source,
  entityClusterSources,
  entityClusterLayers,
} from '@/services/render';
import { marker, createEntityClusterLayers } from '@/services/render';
import type { EntityCategories } from '@/types/entity';
import { currentMarkFilter } from '@/data/marks';

// 获取entity数据
export const getEntityDataByKey = (key: string) => {
  return entityInfo[key];
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
    features.length = 0;
    Object.keys(itemMap).forEach(key => delete itemMap[key]);
    Object.keys(entityGroup).forEach(key => {
      if (entityGroup[key] && entityGroup[key].points) {
        entityGroup[key].points.length = 0;
      }
      delete entityGroup[key];
    });

    // 重置所有实体的计数
    Object.keys(entityInfo).forEach(key => {
      if (entityInfo[key]) {
        entityInfo[key].entityInfo.count = 0;
      }
    });

    // 清空source中的features
    source.clear();

    // 处理每个点位
    for (const point of pointsData) {
      // 更新entityInfo计数
      if (entityInfo[point.entityDataIdKey]?.entityInfo) {
        entityInfo[point.entityDataIdKey].entityInfo.count++;
      }

      // 创建并添加feature
      const feature = marker(point);
      if (feature) {
        features.push(feature);
        itemMap[point.levelLogicId] = feature;
      }
    }

    // 将features添加到source中
    source.addFeatures(features);

    console.log(`成功初始化 ${features.length} 个实体特征`);

    // 默认隐藏所有实体
    Object.keys(entityInfo).forEach(key => {
      if (entityInfo[key]) {
        entityInfo[key].entityInfo.show = false;
      }
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
    Object.entries(entityInfo).map(([key, info]) => [key, info.entityInfo.show])
  );

  // 清空现有图层和源 - 增强清理过程以防止内存泄漏
  entityClusterLayers.forEach(layer => {
    if (layer.getSource()) {
      const source = layer.getSource();
      // 清理聚合源
      if (source && 'getSource' in source) {
        const vectorSource = source.getSource();
        if (vectorSource) {
          vectorSource.clear();
        }
        // 移除聚合关联
        source.setSource(null);
      }
    }
    // 确保图层从所有可能的集合中移除
    layer.setSource(null);
  });

  // 清空数组
  entityClusterLayers.length = 0;

  // 明确清理聚合源对象
  Object.keys(entityClusterSources).forEach(key => {
    const source = entityClusterSources[key];
    if (source) {
      // 清理内部向量源
      const innerSource = source.getSource();
      if (innerSource) {
        innerSource.clear();
      }
      source.setSource(null);
    }
    delete entityClusterSources[key];
  });

  // 清理特征数组
  features.length = 0;

  // 清理实体分组数据
  Object.keys(entityGroup).forEach(key => {
    if (entityGroup[key] && entityGroup[key].points) {
      entityGroup[key].points.length = 0;
    }
    delete entityGroup[key];
  });

  // 清理项目映射
  Object.keys(itemMap).forEach(key => delete itemMap[key]);

  try {
    // 重新初始化实体信息
    const currentPoints = await getCurrentPoints();
    await initializeEntityInfo(currentPoints);

    // 恢复显示状态（只针对新地图中存在的实体）
    for (const key in entityInfo) {
      if (entityInfo[key].entityInfo && showStates[key] !== undefined) {
        entityInfo[key].entityInfo.show = showStates[key];
      }
    }

    // 重新创建聚合图层
    createEntityClusterLayers();
  } catch (error) {
    console.error('重新初始化实体图层失败:', error);
    throw error;
  }
};

// 选择所有实体
export const selectAll = () => {
  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = true;
  }
  notifySelectChange();
};

// 清除所有选择
export const clear = () => {
  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = false;
  }
  notifySelectChange();
};

export const select = (...keys: string[]) => {
  keys.forEach(key => {
    if (entityInfo[key]) {
      entityInfo[key].entityInfo.show = true;
    }
  });
  notifySelectChange();
};

export const unSelect = (...keys: string[]) => {
  keys.forEach(key => {
    if (entityInfo[key]) {
      entityInfo[key].entityInfo.show = false;
    }
  });
  notifySelectChange();
};

export const toggleSelect = (...keys: string[]) => {
  keys.forEach(key => {
    if (entityInfo[key]) {
      entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
    }
  });
  notifySelectChange();
};

// 选择一大类的实体
export const selectByCategory = (category: string) => {
  for (const key in entityInfo) {
    if (entityInfo[key].category === category) {
      entityInfo[key].entityInfo.show = true;
    }
  }
  notifySelectChange();
};

// 取消选择一大类的实体
export const unSelectByCategory = (category: string) => {
  for (const key in entityInfo) {
    if (entityInfo[key].category === category) {
      entityInfo[key].entityInfo.show = false;
    }
  }
  notifySelectChange();
};

export const selectAllByCategory = (category: string) => {
  for (const key in entityInfo) {
    if (entityInfo[key].category === category) {
      entityInfo[key].entityInfo.show = true;
    }
  }
  notifySelectChange();
};

export const unSelectAllByCategory = (category: string) => {
  for (const key in entityInfo) {
    if (entityInfo[key].category === category) {
      entityInfo[key].entityInfo.show = false;
    }
  }
  notifySelectChange();
};

// 切换选择一大类的实体
export const toggleSelectByCategory = (category: string) => {
  for (const key in entityInfo) {
    if (entityInfo[key].category === category) {
      entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
    }
  }
  notifySelectChange();
};

export const toggleSelectByName = (name: string) => {
  for (const key in entityInfo) {
    if (entityInfo[key].entityInfo.name === name) {
      entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
    }
  }
  notifySelectChange();
};

export const onSelectChange = (callback: () => void) => {
  if (typeof callback === 'function') {
    selectCallbacks.push(callback);
  } else {
    console.error('回调函数无效:', callback);
  }
};

export const offSelectChange = (callback: () => void) => {
  const index = selectCallbacks.indexOf(callback);
  if (index !== -1) {
    selectCallbacks.splice(index, 1);
  } else {
    console.error('未找到回调函数:', callback);
  }
};

const notifySelectChange = () => {
  selectCallbacks.forEach(callback => {
    if (typeof callback === 'function') {
      try {
        callback();
      } catch (error) {
        console.error('执行选择状态回调时发生错误:', error);
      }
    }
  });
};
