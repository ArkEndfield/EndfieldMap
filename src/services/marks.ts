import { watch } from 'vue';
import { getAllPoints } from './points';
import { getItem, setItem, StorageType } from '../utils/indexedDBStorage';
import { DATA_DB_KEY } from '@/constants/db_key';
import { MarkChangeCallback, MarkFilterType, MarkInfo } from '@/types/marks';
import { currentMarkFilter, markChangeCallbacks, marks } from '@/data/marks';

const STORAGE_KEY = DATA_DB_KEY.MARKS;

export const onMarkChange = (callback: MarkChangeCallback) => {
  markChangeCallbacks.push(callback);
};

export const offMarkChange = (callback: MarkChangeCallback) => {
  const index = markChangeCallbacks.indexOf(callback);
  if (index !== -1) {
    markChangeCallbacks.splice(index, 1);
  }
};

// 添加触发回调的函数
const notifyMarkChange = () => {
  markChangeCallbacks.forEach(callback => {
    try {
      callback();
    } catch (e) {
      console.error('执行标记变更回调时出错:', e);
    }
  });
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
  allPoints.forEach(point => {
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

  return marks;
};

export const markPoint = (seq: number) => {
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
    delete marks[key];
  });

  // 重新初始化标记数据
  await initMarks();

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
