import type { LoadingState, StageConfig } from '@eftypes/loading';

import { LoadingStageId } from '@/const/loading';
import { ProgressInterpolator } from '@/services/loading/progress_interpolator';

export * from '@/services/loading/progress_interpolator';

declare global {
  interface Window {
    __LOADING_PROGRESS__?: {
      update: (stageId: LoadingStageId, progress: number) => void;
      fail: (error: Error) => void;
    };
  }
}

const STAGE_CONFIGS: StageConfig[] = [
  { id: LoadingStageId.INIT, weight: 5, label: '初始化' },
  { id: LoadingStageId.I18N, weight: 8, label: '加载语言包' },
  { id: LoadingStageId.STORAGE, weight: 12, label: '初始化存储' },
  { id: LoadingStageId.COMPONENTS, weight: 5, label: '加载组件' },
  { id: LoadingStageId.MAP_ADAPTER, weight: 10, label: '初始化地图' },
  { id: LoadingStageId.MAP_RENDER, weight: 50, label: '渲染地图' },
  { id: LoadingStageId.ENTITY_RENDER, weight: 10, label: '加载实体' },
];

class LoadingProgressManager {
  private stages: Map<LoadingStageId, { progress: number; completed: boolean }>;
  private listeners: Set<(state: LoadingState) => void> = new Set();
  private interpolator: ProgressInterpolator;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private error: Error | null = null;

  constructor() {
    this.stages = new Map();
    this.interpolator = new ProgressInterpolator();

    // 初始化所有阶段
    for (const config of STAGE_CONFIGS) {
      this.stages.set(config.id, { progress: 0, completed: false });
    }

    // 标记 INIT 阶段为完成（因为 React 已经加载）
    this.completeStage(LoadingStageId.INIT);

    if (typeof window !== 'undefined') {
      this.startAnimation();
    }
  }

  updateStageProgress(stageId: LoadingStageId, progress: number) {
    if (this.calculateTotalProgress() >= 100) {
      return;
    }
    const stage = this.stages.get(stageId);
    if (stage) {
      // 确保单个阶段进度在 0-100 之间
      stage.progress = Math.max(0, Math.min(100, progress));
      this.syncToGlobal();
    }
  }

  completeStage(stageId: LoadingStageId) {
    if (this.calculateTotalProgress() >= 100) {
      return;
    }
    const stage = this.stages.get(stageId);
    if (stage) {
      stage.progress = 100;
      stage.completed = true;
      this.syncToGlobal();
    }
  }

  setError(error: Error) {
    if (this.calculateTotalProgress() >= 100) {
      return;
    }
    this.error = error;
    this.notifyListeners({
      totalProgress: this.calculateTotalProgress(),
      displayProgress: this.interpolator.getCurrent(),
      currentStage: this.getCurrentStage(),
      isComplete: false,
      error,
    });
    if (typeof window !== 'undefined' && window.__LOADING_PROGRESS__) {
      window.__LOADING_PROGRESS__.fail(error);
    }
  }

  private calculateTotalProgress(): number {
    let totalWeightedProgress = 0;
    let totalWeight = 0;

    for (const config of STAGE_CONFIGS) {
      const stage = this.stages.get(config.id);
      if (stage) {
        totalWeightedProgress += (stage.progress / 100) * config.weight;
        totalWeight += config.weight;
      }
    }

    // 确保总权重不为0，防止除以0
    if (totalWeight === 0) return 0;

    // 确保结果不超过 100
    return Math.min(100, (totalWeightedProgress / totalWeight) * 100);
  }

  private getCurrentStage(): LoadingStageId {
    for (const config of STAGE_CONFIGS) {
      const stage = this.stages.get(config.id);
      if (stage && !stage.completed) {
        return config.id;
      }
    }
    return LoadingStageId.ENTITY_RENDER;
  }

  private startAnimation() {
    const animate = (timestamp: number) => {
      const deltaTime = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0.016;
      this.lastTime = timestamp;

      const targetProgress = this.calculateTotalProgress();
      const displayProgress = this.interpolator.update(targetProgress, deltaTime);

      // 确保显示进度也不超过 100
      const clampedDisplayProgress = Math.min(100, displayProgress);

      const state: LoadingState = {
        totalProgress: targetProgress,
        displayProgress: clampedDisplayProgress,
        currentStage: this.getCurrentStage(),
        isComplete: targetProgress >= 100,
        error: this.error,
      };

      this.notifyListeners(state);

      // 如果有错误，停止动画
      if (this.error) {
        this.animationFrameId = null;
        return;
      }

      // 只有当总进度完成，且显示进度也接近100时才停止动画
      if (!state.isComplete || clampedDisplayProgress < 99.9) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // 动画结束，确保最后发送一次100%的状态
        // 强制确保 displayProgress 是 100
        const finalState: LoadingState = {
          totalProgress: 100,
          displayProgress: 100,
          currentStage: this.getCurrentStage(),
          isComplete: true,
        };
        this.notifyListeners(finalState);
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  // 添加析构清理方法（如果需要）
  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.listeners.clear();
  }

  private syncToGlobal() {
    // 同步到 window.__LOADING_PROGRESS__
    if (typeof window !== 'undefined' && window.__LOADING_PROGRESS__) {
      for (const [stageId, stage] of this.stages) {
        window.__LOADING_PROGRESS__.update(stageId, stage.progress);
      }
    }
  }

  subscribe(listener: (state: LoadingState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(state: LoadingState) {
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const loadingManager = new LoadingProgressManager();
