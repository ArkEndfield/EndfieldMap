import { useCallback, useState } from 'react';

export interface PromiseStateConfig<T, R extends unknown[]> {
  fun: (...args: R) => Promise<T> | T;
  onSuccess?: (data: T) => void;
  onFailed?: (error: Error) => void;
}

export interface PromiseState<T, R extends unknown[]> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  execute: (...args: R) => void;
}

export const usePromiseState = <T, R extends unknown[]>(
  config: PromiseStateConfig<T, R>,
): PromiseState<T, R> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const { fun, onSuccess, onFailed } = config;

  const execute = useCallback(
    async (...args: R) => {
      if (loading) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fun(...args);
        setData(result);
        onSuccess?.(result);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onFailed?.(e);
      } finally {
        setLoading(false);
      }
    },
    [fun, onSuccess, onFailed, loading],
  );

  return { data, error, loading, execute };
};
