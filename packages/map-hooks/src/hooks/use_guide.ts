import type { GuideInfo } from '@endfieldmap/map-service';
import type { MapService } from '@endfieldmap/map-service';
import { useEffect, useState } from 'react';

const guideCache = new Map<number, GuideInfo | null>();
const guideCacheListeners = new Map<number, Set<() => void>>();

/**
 * 清除指定 id 的 guide 缓存，并通知所有正在监听的 useGuide 触发重新拉取。
 * 上传 / 更新成功后调用。
 */
export const invalidateGuideCache = (id: number): void => {
  guideCache.delete(id);
  const listeners = guideCacheListeners.get(id);
  if (listeners) {
    listeners.forEach((listener) => listener());
  }
};

export const useGuide = <T, R>(service: MapService<T, R>, id?: number) => {
  const [data, setData] = useState<GuideInfo | null | undefined>(id ? guideCache.get(id) : null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchToken, setRefetchToken] = useState<number>(0);

  useEffect(() => {
    if (id && guideCache.has(id)) {
      setData(guideCache.get(id));
      setLoading(false);
      setError(null);
    } else if (!id) {
      setData(undefined);
      setLoading(false);
      setError(null);
    }
  }, [id]);

  // 缓存失效订阅：当 invalidateGuideCache 被调用时，递增 token 触发下方 useEffect 重新拉取
  useEffect(() => {
    if (!id) return;
    const listener = () => {
      setData(undefined);
      setRefetchToken((token) => token + 1);
    };
    let bucket = guideCacheListeners.get(id);
    if (!bucket) {
      bucket = new Set();
      guideCacheListeners.set(id, bucket);
    }
    bucket.add(listener);
    return () => {
      const current = guideCacheListeners.get(id);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) {
        guideCacheListeners.delete(id);
      }
    };
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    if (guideCache.has(id)) {
      return;
    }

    setLoading(true);
    setError(null);

    const abortController = new AbortController();

    service.dataService.guideDataService
      .getGuide(id, { signal: abortController.signal })
      .then((result) => {
        if (abortController.signal.aborted) {
          return;
        }

        guideCache.set(id, result ?? null);

        setData(result ?? null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (abortController.signal.aborted) {
          return;
        }
        if (err.name === 'AbortError') {
          return;
        }
        setError(err);
        setLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, [service, id, refetchToken]);

  return { data, loading, error };
};
