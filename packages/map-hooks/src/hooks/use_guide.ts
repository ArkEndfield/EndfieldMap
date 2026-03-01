import type { GuideInfo } from '@endfieldmap/map-service';
import type { MapService } from '@endfieldmap/map-service';
import { useEffect, useState } from 'react';

const guideCache = new Map<number, GuideInfo | null>();

export const useGuide = <T, R>(service: MapService<T, R>, id?: number) => {
  const [data, setData] = useState<GuideInfo | null | undefined>(id ? guideCache.get(id) : null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

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
  }, [service, id]);

  return { data, loading, error };
};
