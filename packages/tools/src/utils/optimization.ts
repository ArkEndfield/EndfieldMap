/**
 * 可调用的函数类型，支持普通函数和返回Promise的函数
 */
export type CallableFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> =
  | ((...args: TArgs) => TReturn)
  | ((...args: TArgs) => Promise<TReturn>);

/**
 * 检查值是否为Promise
 */
export function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // 检查是否是Promise实例
  if (value instanceof Promise) {
    return true;
  }

  // 检查是否是Promise-like对象（有then和catch方法）
  const promiseLike = value as Record<string, unknown>;
  return typeof promiseLike.then === 'function' && typeof promiseLike.catch === 'function';
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 防抖后的函数
 */
export function debounce<TArgs extends unknown[], TReturn>(
  func: CallableFunction<TArgs, TReturn>,
  delay: number,
  immediate = false
): (...args: TArgs) => Promise<TReturn> | undefined {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastPromise: Promise<TReturn> | undefined;

  return (...args: TArgs): Promise<TReturn> | undefined => {
    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        const result = func(...args);
        if (isPromise(result)) {
          lastPromise = result;
        } else {
          lastPromise = undefined;
        }
      }
    }, delay);

    if (callNow) {
      const result = func(...args);
      if (isPromise(result)) {
        lastPromise = result;
        return lastPromise;
      } else {
        lastPromise = undefined;
        return undefined;
      }
    }

    return lastPromise;
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param interval 时间间隔（毫秒）
 * @param options 配置选项
 * @returns 节流后的函数
 */
export function throttle<TArgs extends unknown[], TReturn>(
  func: CallableFunction<TArgs, TReturn>,
  interval: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: TArgs) => Promise<TReturn> | TReturn | undefined {
  const { leading = true, trailing = false } = options;

  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: TArgs | null = null;
  let lastResult: TReturn | undefined;
  let lastPromise: Promise<TReturn> | undefined;

  const execute = (args: TArgs): Promise<TReturn> | TReturn | undefined => {
    lastCallTime = Date.now();
    const result = func(...args);
    if (isPromise(result)) {
      lastPromise = result;
      lastResult = undefined;
      return lastPromise;
    } else {
      lastResult = result;
      lastPromise = undefined;
      return lastResult;
    }
  };

  const delayedExecute = () => {
    if (lastArgs && trailing) {
      execute(lastArgs);
    }
    timeoutId = null;
    lastArgs = null;
  };

  return (...args: TArgs): Promise<TReturn> | TReturn | undefined => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= interval || (leading && lastCallTime === 0)) {
      // 超过间隔时间或首次调用（leading 模式），可以执行
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return execute(args);
    } else if (!timeoutId && trailing) {
      // 间隔内，设置延迟执行
      lastArgs = args;
      timeoutId = setTimeout(delayedExecute, interval - timeSinceLastCall);
    }

    return lastPromise || lastResult;
  };
}
