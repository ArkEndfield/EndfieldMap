import { reactive, watchEffect, ref } from 'vue';
import { allPoints } from './points';
import { getItem, setItem, StorageType } from '../utils/indexedDBStorage';

export interface MarkInfoDetail {
  finish: boolean;
}

export type MarkInfo = Record<string | number, MarkInfoDetail>;

// 添加标记筛选类型定义
export type MarkFilterType = 'all' | 'marked' | 'unmarked';

// 添加当前筛选状态
export const currentMarkFilter = ref<MarkFilterType>('all');

// 添加一个用于标记状态变更通知的ref
export const markStateChangeTrigger = ref(0);

// 添加一个回调函数列表，用于当标记状态变化时通知外部
export type MarkChangeCallback = () => void;
const markChangeCallbacks: MarkChangeCallback[] = [];

// 添加注册回调的函数
export const onMarkChange = (callback: MarkChangeCallback) => {
  markChangeCallbacks.push(callback);
};

// 添加触发回调的函数
const notifyMarkChange = () => {
  // 确保是同步调用所有回调，避免任何延迟
  // console.log(`执行${markChangeCallbacks.length}个标记变更回调`);
  markChangeCallbacks.forEach(callback => {
    try {
      callback();
    } catch (e) {
      console.error('执行标记变更回调时出错:', e);
    }
  });
};

export const marks: MarkInfo = reactive({});

export const initMarksData = async () => {
  // 清空现有数据
  Object.keys(marks).forEach(key => {
    delete marks[key];
  });
  // 初始加载
  await loadMarksFromStorage();
  // 初始化标记数据
  allPoints.forEach(point => {
    if (!marks[point.levelLogicId]) {
      marks[point.levelLogicId] = {
        finish: false,
      };
    }
  });
  // console.log('标记数据初始化完成');
  // console.log('标记数据:', marks);
  // 监听变化并保存
  watchEffect(() => {
    // 同时仍然调用现有的回调机制
    notifyMarkChange();
    saveMarksToStorage();
  });
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

    // 使用计数器触发变更通知
    markStateChangeTrigger.value++;
    // console.log('触发标记状态变更计数器:', markStateChangeTrigger.value);

    return marks[seq].finish;
  }
  return false;
};

// IndexedDB存储的键名
const STORAGE_KEY = 'endfield-map-marks';

// 保存到IndexedDB永久存储
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
    // 当IndexedDB存储失败时，尝试使用localStorage作为备份
    try {
      // 同样使用普通对象进行序列化
      const plainMarks = Object.keys(marks).reduce((obj, key) => {
        obj[key] = {
          finish: marks[key].finish,
        };
        return obj;
      }, {} as MarkInfo);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(plainMarks));
      console.log('标记数据已备份到localStorage');
    } catch (e) {
      console.error('备份标记数据到localStorage也失败了:', e);
    }
  }
};

// 构造默认数据
export const initMarks = () => {
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

    // 尝试从localStorage读取作为备份
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        console.log('从localStorage加载标记数据(备份)');
        const parsed = JSON.parse(localData);
        Object.keys(parsed).forEach(key => {
          marks[key] = parsed[key];
        });
      }
    } catch (backupError) {
      console.error('从localStorage加载标记数据备份也失败了:', backupError);
    }
  }
};

// 新增标记筛选函数
export const setMarkFilter = (filterType: MarkFilterType) => {
  currentMarkFilter.value = filterType;
  // console.log(`标记筛选状态变更为: ${filterType}`);
  return currentMarkFilter.value;
};

// 判断指定序号的点位是否应该显示
export const shouldShowByMarkStatus = (seq: number): boolean => {
  // 通过闭包捕获当前的markStateChangeTrigger值，确保函数会重新评估

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
