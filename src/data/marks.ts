import { reactive, watchEffect, ref } from 'vue';
import { points } from './points';

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

const initData = points.reduce((acc, point) => {
  const { seq } = point;
  if (!acc[seq]) {
    acc[seq] = {
      finish: false,
    };
  }
  return acc;
}, {} as MarkInfo);

export const marks: MarkInfo = reactive(initData);

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

// 本地存储功能
const STORAGE_KEY = 'endfield-map-marks';

// 保存到本地存储
export const saveMarksToStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
};

// 从本地存储加载
export const loadMarksFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(key => {
        if (marks[key]) {
          marks[key].finish = parsed[key].finish;
        }
      });
    }
  } catch (e) {
    console.error('Failed to load marks from storage', e);
  }
};

// 初始加载
loadMarksFromStorage();

// 监听变化并保存
watchEffect(() => {
  // 同时仍然调用现有的回调机制
  notifyMarkChange();
  saveMarksToStorage();
});

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
