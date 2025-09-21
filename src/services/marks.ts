import { watch } from 'vue';
import { isInConnectionMode } from './electricPoleConnector';
import { getAllPoints } from './points';
import { getItem, setItem, StorageType } from '../utils/indexedDBStorage';
import { DATA_DB_KEY } from '@/constants/db_key';
import { MarkFilterType, MarkInfo } from '@/types/marks';
import {
  currentMarkFilter,
  isMultiSelecting,
  marks,
  multiSelectMarks,
} from '@/data/marks';
import { getCustomPoints } from './customPoints';
import { pubsub, EVENTS } from './pubsub';

const STORAGE_KEY = DATA_DB_KEY.MARKS;

// 通知标记变更
export const notifyMarkChange = () => {
  pubsub.publish(EVENTS.MARK_CHANGE);
};

// 通知多选状态变更
export const notifyMultiSelectStateChange = () => {
  pubsub.publish(EVENTS.MULTI_SELECT_STATE_CHANGE);
};

// 通知多选变更
export const notifyMultiSelectChange = () => {
  pubsub.publish(EVENTS.MULTI_SELECT_CHANGE);
};

// 修改为异步初始化函数
export const initMarksData = async () => {
  // 清空现有数据
  Object.keys(marks).forEach(key => {
    delete marks[key];
  });
  // 初始加载
  await loadMarksFromStorage();
  // 初始化标记数据
  const allPoints = await getAllPoints();
  const customPoints = await getCustomPoints();
  allPoints.forEach(point => {
    if (!marks[point.levelLogicId]) {
      marks[point.levelLogicId] = {
        finish: false,
      };
    }
  });
  customPoints.forEach(point => {
    if (!marks[point.levelLogicId]) {
      marks[point.levelLogicId] = {
        finish: false,
      };
    }
  });
  console.log(
    '标记数据初始化完成，共处理标记',
    Object.keys(marks).length,
    '个'
  );

  // 监听变化并保存
  watch(marks, () => {
    // 同时仍然调用现有的回调机制
    notifyMarkChange();
    saveMarksToStorage();
  });

  watch(isMultiSelecting, () => {
    notifyMultiSelectStateChange();
  });

  watch(
    multiSelectMarks,
    () => {
      notifyMultiSelectChange();
    },
    { deep: true }
  );

  return marks;
};

export const markPoint = (seq: number | string) => {
  if (marks[seq]) {
    // 直接修改值而不是使用Object.assign，简化操作
    marks[seq].finish = !marks[seq].finish;

    // 添加调试输出
    // console.log(`标记点 ${seq} 状态改变为:`, marks[seq].finish);
    // console.log(`当前筛选模式:`, currentMarkFilter.value);

    // 确保存储更新
    saveMarksToStorage();

    // 触发状态变更通知
    notifyMarkChange();

    return marks[seq].finish;
  }
  return false;
};

export const markPointsAsFinished = (...ids: (number | string)[]) => {
  ids.forEach(id => {
    if (marks[id]) {
      marks[id].finish = true;
    } else {
      marks[id] = {
        finish: true,
      };
    }
  });
};

export const markPointsAsUnfinished = (...ids: (number | string)[]) => {
  ids.forEach(id => {
    if (marks[id]) {
      marks[id].finish = false;
    } else {
      marks[id] = {
        finish: false,
      };
    }
  });
};

// 修改为明确的异步函数
export const saveMarksToStorage = async () => {
  try {
    // 复制一个普通的对象，去除Vue的响应式包装
    const plainMarks = Object.keys(marks).reduce((obj, key) => {
      obj[key] = {
        finish: marks[key].finish,
      };
      return obj;
    }, {} as MarkInfo);

    await setItem(STORAGE_KEY, plainMarks, StorageType.PERMANENT, null);
    // console.log('标记数据已保存到IndexedDB永久存储');
  } catch (error) {
    console.error('保存标记数据到IndexedDB失败:', error);
  }
};

// 构造默认数据
export const initMarks = async () => {
  const allPoints = await getAllPoints();
  allPoints.forEach(point => {
    if (!marks[point.levelLogicId]) {
      marks[point.levelLogicId] = {
        finish: false,
      };
    }
  });
};

// 从IndexedDB永久存储加载
export const loadMarksFromStorage = async () => {
  try {
    // 尝试从IndexedDB加载
    const savedData = await getItem<MarkInfo>(
      STORAGE_KEY,
      StorageType.PERMANENT
    );

    if (savedData) {
      // console.log('从IndexedDB加载标记数据成功');
      Object.keys(savedData).forEach(key => {
        marks[key] = savedData[key];
      });
      return;
    }
  } catch (e) {
    console.error('加载标记数据失败:', e);
  }
};

// 新增标记筛选函数
export const setMarkFilter = (filterType: MarkFilterType) => {
  // 如果筛选类型没有变化，则不执行任何操作
  if (currentMarkFilter.value === filterType) {
    return currentMarkFilter.value;
  }

  // 更新筛选状态
  currentMarkFilter.value = filterType;

  // 使用entity.ts中的refresh来应用筛选，避免完全重新加载
  notifyMarkChange();

  return currentMarkFilter.value;
};

// 判断指定序号的点位是否应该显示
export const shouldShowByMarkStatus = (seq: number): boolean => {
  // 如果没有筛选，则显示所有点位
  if (currentMarkFilter.value === 'all') {
    return true;
  }

  // 检查点位是否存在
  if (!marks[seq]) {
    return false;
  }

  // 根据筛选条件判断点位是否显示
  if (currentMarkFilter.value === 'marked') {
    return marks[seq].finish === true;
  } else if (currentMarkFilter.value === 'unmarked') {
    return marks[seq].finish === false;
  }

  return true;
};

// 判断指定序号的点位是否完成
export const isMarked = (seq: number | string): boolean => {
  // 增加检查，确保 marks[seq] 存在
  return marks[seq] ? marks[seq].finish === true : false;
};

// 判断指定序号的点位是否未完成
export const isUnmarked = (seq: number | string): boolean => {
  // 同样增加检查
  return marks[seq] ? marks[seq].finish === false : true; // 如果不存在，视为未完成
};

// 开始批量选择
export const startMultiSelect = () => {
  if (isInConnectionMode.value) {
    pubsub.publish(EVENTS.SHOW_ALERT, {
      content: 'multi_operate.no_electric_pole_connector',
      useI18n: true,
    });
    return;
  }
  isMultiSelecting.value = true;
};

// 取消批量选择
export const cancelMultiSelect = () => {
  isMultiSelecting.value = false;
  multiSelectMarks.value = [];
};

// toggle 批量选择
export const toggleMultiSelectState = () => {
  if (isMultiSelecting.value) {
    cancelMultiSelect();
  } else {
    startMultiSelect();
  }
};

// 添加到批量选择
export const addToMultiSelect = (...ids: number[]) => {
  multiSelectMarks.value.push(...ids);
};

// 移除批量选择
export const removeFromMultiSelect = (...ids: number[]) => {
  multiSelectMarks.value = multiSelectMarks.value.filter(
    id => !ids.includes(id)
  );
};

// toggle 批量选择
export const toggleMultiSelect = (id: number) => {
  if (multiSelectMarks.value.includes(id)) {
    removeFromMultiSelect(id);
  } else {
    addToMultiSelect(id);
  }
};

// 清空批量选择
export const clearMultiSelect = () => {
  multiSelectMarks.value = [];
};

// 将当前批量选择标记为完成
export const finishMultiSelect = () => {
  multiSelectMarks.value.forEach(id => {
    markPointsAsFinished(id);
  });
  clearMultiSelect();
};

// 将当前批量选择标记为未完成
export const unfinishMultiSelect = () => {
  multiSelectMarks.value.forEach(id => {
    markPointsAsUnfinished(id);
  });
  clearMultiSelect();
};

// 获取当前标点数据（indexedDB）
export const getMarks = () => {
  return JSON.parse(JSON.stringify(marks));
};

export const isMarkDataValid = (data: any): data is MarkInfo => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  for (const key in data) {
    if (typeof key !== 'string' && typeof key !== 'number') {
      return false;
    }
    if (typeof data[key] !== 'object' || data[key] === null) {
      return false;
    }
    if (typeof data[key].finish !== 'boolean') {
      return false;
    }
  }
  return true;
};

// 导入标点数据（覆盖）
export const coverMarks = async (newMarks?: MarkInfo | null) => {
  if (!isMarkDataValid(newMarks)) {
    throw new Error('无效的标记数据格式');
  }
  // 清空现有数据
  Object.keys(marks).forEach(key => {
    marks[key] = {
      finish: false,
    };
  });

  // 导入新数据
  Object.keys(newMarks).forEach(key => {
    marks[key] = newMarks[key];
  });

  // 保存到IndexedDB
  await saveMarksToStorage();

  // 刷新状态
  notifyMarkChange();
};

// 导入标点数据（合并）
export const mergeMarks = async (newMarks?: MarkInfo | null) => {
  if (!isMarkDataValid(newMarks)) {
    throw new Error('无效的标记数据格式');
  }

  // 合并新数据
  Object.keys(newMarks).forEach(key => {
    if (!marks[key]) {
      marks[key] = newMarks[key];
    } else {
      marks[key].finish = marks[key].finish || newMarks[key].finish;
    }
  });

  // 保存到IndexedDB
  await saveMarksToStorage();

  // 刷新状态
  notifyMarkChange();
};

// 导出multiSelectMarks
export { multiSelectMarks };
