/**
 * animationTimer.ts
 * 基于requestAnimationFrame封装的计时器工具，用于替代setTimeout和setInterval
 */

import getRequestAnimationFrame, {
  cancelRequestAnimationFrame,
} from './getRequestAnimationFrame';

/**
 * 封装的requestAnimationFrame版本的setTimeout
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒）
 * @returns 计时器ID，可用于取消
 */
export function rafTimeout(
  callback: (...args: any[]) => any,
  delay: number = 0
): number {
  const requestRaf = getRequestAnimationFrame();
  const startTime = performance.now();
  let timerId: number;

  const tick = () => {
    const currentTime = performance.now();
    const elapsedTime = currentTime - startTime;

    if (elapsedTime >= delay) {
      callback();
    } else {
      timerId = requestRaf(tick);
    }
  };

  timerId = requestRaf(tick);
  return timerId;
}

/**
 * 取消rafTimeout
 * @param id 计时器ID
 */
export function cancelRafTimeout(id: number): void {
  cancelRequestAnimationFrame(id);
}

/**
 * rafInterval的返回对象类型
 */
export interface RafIntervalResult {
  /** 间隔计时器ID */
  id: number;
  /** 取消计时器函数 */
  cancel: () => void;
  /** 暂停计时器 */
  pause: () => void;
  /** 恢复计时器 */
  resume: () => void;
  /** 更新间隔时间（毫秒） */
  updateDelay: (newDelay: number) => void;
}

/**
 * rafInterval的选项
 */
export interface RafIntervalOptions {
  /** 是否立即执行第一次回调（默认:false） */
  immediate?: boolean;
  /** 最大执行次数（默认:无限） */
  maxExecutions?: number;
  /** 是否自动调整计时以适应帧率（默认:true） */
  autoAdjust?: boolean;
  /** 完成所有执行后的回调 */
  onComplete?: () => void;
}

/**
 * 封装的requestAnimationFrame版本的setInterval
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒）
 * @param options 高级选项
 * @returns 包含id和控制方法的对象
 */
export function rafInterval(
  callback: () => void,
  delay: number = 0,
  options: RafIntervalOptions = {}
): RafIntervalResult {
  const requestRaf = getRequestAnimationFrame();
  const {
    immediate = false,
    maxExecutions,
    autoAdjust = true,
    onComplete,
  } = options;

  let startTime = performance.now();
  let timerId: number;
  let isRunning = true;
  let executionCount = 0;
  let accumulatedDelay = 0;
  let currentDelay = delay;

  // 如果设置了立即执行，则立即调用回调
  if (immediate && isRunning) {
    callback();
    executionCount++;
  }

  const tick = (currentTime: number) => {
    if (!isRunning) {
      timerId = requestRaf(tick);
      return;
    }

    const elapsedTime = currentTime - startTime;

    if (elapsedTime >= currentDelay) {
      // 执行回调
      callback();
      executionCount++;

      // 处理最大执行次数
      if (maxExecutions !== undefined && executionCount >= maxExecutions) {
        if (onComplete) onComplete();
        return; // 不再继续调度
      }

      // 计算时间偏差，用于自动调整
      if (autoAdjust) {
        // 如果帧率不稳定，尝试通过调整下一次执行时间来补偿
        const drift = elapsedTime - currentDelay;
        accumulatedDelay = drift > 16 ? 0 : accumulatedDelay + drift;

        // 重设起始时间，考虑累积的延迟偏差
        startTime =
          currentTime - (accumulatedDelay > 50 ? 0 : accumulatedDelay);
      } else {
        // 不调整，简单重设起始时间
        startTime = currentTime;
      }
    }

    timerId = requestRaf(tick);
  };

  timerId = requestRaf(tick);

  return {
    id: timerId,
    cancel: () => {
      cancelRequestAnimationFrame(timerId);
      isRunning = false;
    },
    pause: () => {
      isRunning = false;
    },
    resume: () => {
      if (!isRunning) {
        isRunning = true;
        startTime = performance.now();
      }
    },
    updateDelay: (newDelay: number) => {
      currentDelay = newDelay;
    },
  };
}

/**
 * 帧节流函数 - 保证函数最多每N帧执行一次
 * @param callback 回调函数
 * @param frameCount 帧数间隔
 * @returns 节流后的函数
 */
export function frameThrottle(
  callback: (...args: any[]) => void,
  frameCount: number = 1
) {
  let frameCounter = 0;

  return function (this: any, ...args: any[]) {
    frameCounter++;
    if (frameCounter >= frameCount) {
      frameCounter = 0;
      callback.apply(this, args);
    }
  };
}

/**
 * 创建基于requestAnimationFrame的动画
 * @param callback 每帧执行的回调，参数为动画进度(0-1)和当前时间
 * @param duration 动画持续时间（毫秒）
 * @param options 选项（缓动函数、完成回调等）
 * @returns 包含id和cancel方法的对象
 */
export function createRafAnimation(
  callback: (progress: number, currentTime: number) => void,
  duration: number = 300,
  options: {
    easing?: (t: number) => number;
    onComplete?: () => void;
  } = {}
): { id: number; cancel: () => void } {
  const requestRaf = getRequestAnimationFrame();
  const startTime = performance.now();
  let animationId: number;

  // 默认缓动函数 - 三次方缓出（更自然）
  const defaultEasing = (t: number): number => 1 - Math.pow(1 - t, 3);
  const easing = options.easing || defaultEasing;

  const animate = (currentTime: number) => {
    const elapsedTime = currentTime - startTime;
    const rawProgress = Math.min(elapsedTime / duration, 1);
    const easedProgress = easing(rawProgress);

    callback(easedProgress, currentTime);

    if (rawProgress < 1) {
      animationId = requestRaf(animate);
    } else if (options.onComplete) {
      options.onComplete();
    }
  };

  animationId = requestRaf(animate);

  return {
    id: animationId,
    cancel: () => {
      cancelRequestAnimationFrame(animationId);
    },
  };
}
