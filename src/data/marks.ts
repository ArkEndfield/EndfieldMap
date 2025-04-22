import { reactive, ref } from 'vue';

import { MarkFilterType, MarkInfo } from '@/types/marks';

// 添加当前筛选状态
export const currentMarkFilter = ref<MarkFilterType>('all');

export const marks: MarkInfo = reactive({});

export const isMultiSelecting = ref(false);

export const multiSelectMarks = ref<number[]>([]);
