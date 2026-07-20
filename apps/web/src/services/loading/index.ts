import type { LoadingState, StageConfig } from '@eftypes/loading';

import { LoadingStageId } from '@/const/loading';

declare global {
  interface Window {
    __LOADING_PROGRESS__?: {
      target: number;
      update: (stageId: LoadingStageId, progress: number) => void;
      fail: (error: Error) => void;
      hide: () => void;
    };
  }
}

/**
 * 各阶段权重，按实测耗时分配（合计 100）。
 *
 * 权重决定进度条在每个阶段能走多远，与真实耗时脱节时用户就会看到
 * 「卡在某个百分比不动、最后一瞬间冲到 100%」。这里的分配对应：
 * bundle 就绪 → i18n → 存储/用户数据 → 地图适配器 → 实体渲染。
 *
 * 注意：`apps/web/index.html` 里的内联加载器有一份同样的权重表
 * （React 加载前就要用），两处必须保持一致。
 */
const STAGE_CONFIGS: StageConfig[] = [
  { id: LoadingStageId.INIT, weight: 5, label: '初始化' },
  { id: LoadingStageId.I18N, weight: 15, label: '加载语言包' },
  { id: LoadingStageId.STORAGE, weight: 25, label: '初始化存储' },
  { id: LoadingStageId.COMPONENTS, weight: 5, label: '加载组件' },
  { id: LoadingStageId.MAP_ADAPTER, weight: 15, label: '初始化地图' },
  { id: LoadingStageId.MAP_RENDER, weight: 10, label: '渲染地图' },
  { id: LoadingStageId.ENTITY_RENDER, weight: 25, label: '加载实体' },
];

const TOTAL_WEIGHT = STAGE_CONFIGS.reduce((sum, config) => sum + config.weight, 0);

/**
 * 启动进度的状态机。
 *
 * 只负责「各阶段进度 → 总进度」，缓动交给 index.html 里的内联加载器统一做。
 * 此前这里还有一套弹簧插值，和内联加载器的缓动串联成两级滞后，
 * 数据早就就绪了进度条还在慢慢爬——那正是刷新后「卡很久」的一部分。
 */
class LoadingProgressManager {
  private stages: Map<LoadingStageId, { progress: number; completed: boolean }>;
  private listeners: Set<(state: LoadingState) => void> = new Set();
  private error: Error | null = null;

  constructor() {
    this.stages = new Map(STAGE_CONFIGS.map((config) => [config.id, { progress: 0, completed: false }]));

    // 标记 INIT 阶段为完成（因为 React 已经加载）
    this.completeStage(LoadingStageId.INIT);
  }

  updateStageProgress(stageId: LoadingStageId, progress: number) {
    this.setStage(stageId, Math.max(0, Math.min(100, progress)), false);
  }

  completeStage(stageId: LoadingStageId) {
    this.setStage(stageId, 100, true);
  }

  setError(error: Error) {
    if (this.error) return;
    this.error = error;
    this.emit();
    window.__LOADING_PROGRESS__?.fail(error);
  }

  subscribe(listener: (state: LoadingState) => void) {
    this.listeners.add(listener);
    // 立即同步一次当前状态，避免订阅方错过订阅前已经发生的进度
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStage(stageId: LoadingStageId, progress: number, completed: boolean) {
    const stage = this.stages.get(stageId);
    if (!stage || this.error) return;

    // 进度只增不减：同一阶段可能被多个来源上报（serviceEmitter 事件 + 显式调用），
    // 否则后到的小数值会让进度条往回跳
    const nextProgress = Math.max(stage.progress, progress);
    const nextCompleted = stage.completed || completed;
    if (nextProgress === stage.progress && nextCompleted === stage.completed) return;

    stage.progress = nextProgress;
    stage.completed = nextCompleted;

    window.__LOADING_PROGRESS__?.update(stageId, stage.progress);
    this.emit();
  }

  private get totalProgress(): number {
    let weighted = 0;
    for (const config of STAGE_CONFIGS) {
      weighted += ((this.stages.get(config.id)?.progress ?? 0) / 100) * config.weight;
    }
    return Math.min(100, (weighted / TOTAL_WEIGHT) * 100);
  }

  private get currentStage(): LoadingStageId {
    return STAGE_CONFIGS.find((config) => !this.stages.get(config.id)?.completed)?.id ?? LoadingStageId.ENTITY_RENDER;
  }

  private getState(): LoadingState {
    const totalProgress = this.totalProgress;
    return {
      totalProgress,
      displayProgress: totalProgress,
      currentStage: this.currentStage,
      isComplete: !this.error && totalProgress >= 100,
      error: this.error,
    };
  }

  private emit() {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const loadingManager = new LoadingProgressManager();
