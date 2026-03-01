import { useState, useEffect, useCallback, useRef } from 'react';
import type { MapService } from '@endfieldmap/map-service';
import type { Announcement, AnnouncementBreif } from '@endfieldmap/map-service/@types/announcement';

interface UseAnnouncementOptions {
  pageSize?: number;
}

export const useAnnouncement = <T, R>(service: MapService<T, R>, options: UseAnnouncementOptions = {}) => {
  const { pageSize = 10 } = options;

  // List State
  const [list, setList] = useState<AnnouncementBreif[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [listError, setListError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Detail State
  const [detail, setDetail] = useState<Announcement | undefined>(undefined);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<Error | null>(null);

  // Controllers for cancellation
  const listAbortControllerRef = useRef<AbortController | null>(null);
  const detailAbortControllerRef = useRef<AbortController | null>(null);

  const loadList = useCallback(
    async (targetPage: number, isRefresh: boolean = false) => {
      if (listAbortControllerRef.current) {
        listAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      listAbortControllerRef.current = abortController;

      setListLoading(true);
      setListError(null);

      try {
        const result = await service.dataService.announcementDataService.loadAnnouncementList(pageSize, targetPage, {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        setList((prev) => (isRefresh ? result || [] : [...prev, ...(result || [])]));
        setPage(targetPage);
        setHasMore(result ? result.length >= pageSize : false);
      } catch (err: any) {
        if (abortController.signal.aborted || err.name === 'AbortError') return;
        setListError(err);
      } finally {
        if (!abortController.signal.aborted) {
          setListLoading(false);
          listAbortControllerRef.current = null;
        }
      }
    },
    [service, pageSize]
  );

  const refreshList = useCallback(() => {
    return loadList(1, true);
  }, [loadList]);

  const loadMore = useCallback(() => {
    if (!hasMore || listLoading) return;
    return loadList(page + 1, false);
  }, [loadList, page, hasMore, listLoading]);

  const loadDetail = useCallback(
    async (id: number) => {
      if (detailAbortControllerRef.current) {
        detailAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      detailAbortControllerRef.current = abortController;

      setDetailLoading(true);
      setDetailError(null);
      setDetail(undefined); // Clear previous detail when loading a new one

      try {
        const result = await service.dataService.announcementDataService.loadAnnouncementDetail(id, {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        setDetail(result);
      } catch (err: any) {
        if (abortController.signal.aborted || err.name === 'AbortError') return;
        setDetailError(err);
      } finally {
        if (!abortController.signal.aborted) {
          setDetailLoading(false);
          detailAbortControllerRef.current = null;
        }
      }
    },
    [service]
  );

  // Initial load
  useEffect(() => {
    refreshList();

    return () => {
      // Cleanup on unmount
      if (listAbortControllerRef.current) listAbortControllerRef.current.abort();
      if (detailAbortControllerRef.current) detailAbortControllerRef.current.abort();
    };
  }, [refreshList]);

  return {
    list,
    listLoading,
    listError,
    refreshList,
    loadMore,
    hasMore,

    detail,
    detailLoading,
    detailError,
    loadDetail,
  };
};
