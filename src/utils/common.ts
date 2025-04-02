export const xyz2crd = (pos: { x: number; y: number; z: number }) => {
  const coords =
    localStorage.getItem('map') === 'map002'
      ? [pos.x / 8 + 80, pos.z / 8 + 224]
      : [pos.x / 8 + 128, pos.z / 8 + 160];

  return coords;
};

// 添加防抖函数，支持Promise和立即执行模式
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
) {
  let timer: number | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  // 默认值
  const leading = options.leading ?? false;
  const trailing = options.trailing ?? true;

  // 创建可取消的函数包装
  const debouncedFunction = function (
    this: any,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    lastArgs = args;
    lastThis = this;

    // 创建一个新的Promise
    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        // 立即执行模式
        if (leading && !timer) {
          try {
            const result = fn.apply(this, args);
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(error);
          }
        }

        // 清除现有定时器
        if (timer) {
          clearTimeout(timer);
        }

        // 设置延迟执行
        if (trailing) {
          timer = window.setTimeout(() => {
            if (!lastArgs) return;

            try {
              const result = fn.apply(lastThis, lastArgs);
              if (result instanceof Promise) {
                result
                  .then(resolve)
                  .catch(reject)
                  .finally(() => {
                    pendingPromise = null;
                  });
              } else {
                resolve(result);
                pendingPromise = null;
              }
            } catch (error) {
              reject(error);
              pendingPromise = null;
            }

            timer = null;
            lastArgs = null;
            lastThis = null;
          }, delay);
        } else {
          pendingPromise = null;
        }
      });
    }

    return pendingPromise;
  };

  // 添加取消方法
  debouncedFunction.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
    lastThis = null;
    pendingPromise = null;
  };

  // 添加立即执行方法
  debouncedFunction.flush = function (): Promise<ReturnType<T>> | null {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    if (lastArgs && lastThis) {
      const result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
      pendingPromise = null;
      return result instanceof Promise ? result : Promise.resolve(result);
    }
    return null;
  };

  return debouncedFunction as typeof debouncedFunction & {
    cancel: () => void;
    flush: () => Promise<ReturnType<T>> | null;
  };
}

// 增加节流函数，用于频繁更新的UI事件
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
) {
  let timer: number | null = null;
  let lastTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let pendingExecute = false;

  // 默认值
  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;

  return function (this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;

    // 检查是否应该立即执行
    if (!lastTime && !leading) {
      lastTime = now;
    }

    const remaining = delay - (now - lastTime);

    // 如果时间已过期，或者是第一次调用并启用了leading
    if (remaining <= 0 || remaining > delay) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      lastTime = now;
      fn.apply(this, args);
      lastArgs = null;
      lastThis = null;
      pendingExecute = false;
    } else if (trailing && !timer && !pendingExecute) {
      // 设置延迟执行
      pendingExecute = true;
      timer = window.setTimeout(() => {
        lastTime = leading ? Date.now() : 0;
        timer = null;
        if (lastArgs && lastThis) {
          fn.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
        pendingExecute = false;
      }, remaining);
    }
  };
}
