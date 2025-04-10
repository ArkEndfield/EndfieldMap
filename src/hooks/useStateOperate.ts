import { rafTimeout } from '@/utils/animationTimer';
import { ref } from 'vue';
/**
 * 用于处理异步操作的组合函数，提供了 loading 状态、错误处理和数据存储的功能。
 * @param fn 需要执行的异步函数
 * @param options 可选的配置对象
 * @param options.onSuccess 成功回调函数
 * @param options.onError 错误回调函数
 * @param options.onFinally 最终回调函数
 * @param options.resetTime 重置时间，单位为毫秒，如果为 0 或者不传，则不重置
 * @returns 返回一个对象，包含 loading 状态、错误信息、数据、执行函数和重置函数
 * @example
 * const { loading, error, data, execute, reset } = useLoadingOperate(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * }, {
 *   onSuccess: (data) => {
 *     console.log('成功获取数据:', data);
 *   },
 *   onError: (error) => {
 *     console.error('获取数据失败:', error);
 *   },
 *   onFinally: () => {
 *     console.log('操作完成');
 *   },
 *   resetTime: 2000,
 * });
 * execute();
 */
export default function useStateOperate<T>(
  fn: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
    resetTime?: number;
  }
) {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const data = ref<T | null>(null);
  const success = ref(false);
  const finished = ref(false);
  const execute = async () => {
    reset();
    loading.value = true;
    error.value = null;
    try {
      data.value = await fn();
      options?.onSuccess?.(data.value);
      success.value = true;
    } catch (err) {
      error.value = err as Error;
      options?.onError?.(error.value);
    } finally {
      loading.value = false;
      finished.value = true;
      options?.onFinally?.();
      if (options?.resetTime) {
        rafTimeout(() => {
          reset();
        }, options.resetTime);
      }
    }
  };
  const reset = () => {
    loading.value = false;
    finished.value = false;
    success.value = false;
    error.value = null;
    data.value = null;
  };
  return {
    loading,
    error,
    data,
    success,
    finished,
    execute,
    reset,
  };
}
