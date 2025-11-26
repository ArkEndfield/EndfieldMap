import { useCallback, useState } from 'react';

export interface PromiseState<T, R extends unknown[]> {
  data: T | null;
  success: boolean;
  error: Error | null;
  loading: boolean;
  execute: (...args: R) => void;
  state: 'executing' | 'done';
}

export interface PromiseStateConfig<T, R extends unknown[]> {
  fun: (...args: R) => Promise<T> | T;
  onSuccess?: (data: T) => void;
  onFailed?: (error: Error) => void;
  onDone?: (success?: boolean, error?: Error | null, data?: T) => void;
  onBeforeExecute?: () => void;
  onAfterExecute?: () => void;
}

export const usePromiseState = <T, R extends unknown[]>(config: PromiseStateConfig<T, R>): PromiseState<T, R> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<'executing' | 'done'>('done');

  const execute = useCallback(
    async (...args: R) => {
      if (loading) {
        return;
      }

      config.onBeforeExecute?.();
      setLoading(true);
      setState('executing');
      setError(null);
      const func = config.fun;
      try {
        const result = await func(...args);
        setData(result);
        config.onSuccess?.(result);
        config.onDone?.(true, null, result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        config.onFailed?.(error);
        config.onDone?.(false, error, undefined);
      } finally {
        setLoading(false);
        setState('done');
        config.onAfterExecute?.();
      }
    },
    [config, loading]
  );

  return {
    data,
    success: !error && data !== null,
    error,
    loading,
    execute,
    state,
  };
};
