import { reactive, ref } from 'vue';

import { MarkChangeCallback, MarkFilterType, MarkInfo } from '@/types/marks';

// 添加当前筛选状态
export const currentMarkFilter = ref<MarkFilterType>('all');

// 用于标记状态变更通知的ref
export const markStateChangeTrigger = ref(0);

// 回调函数列表，用于当标记状态变化时通知外部
export const markChangeCallbacks: MarkChangeCallback[] = [];

export const marks: MarkInfo = reactive({});
