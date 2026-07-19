import type { MapService } from '@endfieldmap/map-service';
import type {
  Announcement,
  AnnouncementBreif,
  CategoriedAnnouncementBreif,
} from '@endfieldmap/map-service/@types/announcement';
import { LocalStorageKey, LocalStorageValue } from '@endfieldmap/tools';
import { useCallback, useEffect, useMemo,useRef, useState } from 'react';

const readAnnouncementLocalStorage = new LocalStorageValue<Announcement['id'][]>({
  storageKey: LocalStorageKey.READ_ANNOUNCEMENT,
  initialValue: [],
});

const promptedAnnouncementLocalStorage = new LocalStorageValue<Announcement['id'][]>({
  storageKey: LocalStorageKey.PROMPTED_ANNOUNCEMENT,
  initialValue: [],
});

export const useAnnouncement = <T, R>(service: MapService<T, R>) => {
  const readAnnouncementIds = readAnnouncementLocalStorage.value;
  const promptedAnnouncementIds = promptedAnnouncementLocalStorage.value;
  // List State
  const [listData, setListData] = useState<AnnouncementBreif[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [listError, setListError] = useState<Error | null>(null);

  // Detail State
  const [detail, setDetail] = useState<Announcement | undefined>(undefined);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<Error | null>(null);

  // Controllers for cancellation
  const listAbortControllerRef = useRef<AbortController | null>(null);
  const detailAbortControllerRef = useRef<AbortController | null>(null);

  const list = useMemo(() => {
    const data = listData.map((item) => {
      return {
        ...item,
        read: readAnnouncementIds.includes(item.id),
      };
    });

    const categoriedList = data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          hasUnread: false,
          list: [],
        };
      }
      acc[item.category].list.push(item);
      if (!item.read) {
        acc[item.category].hasUnread = true;
      }
      return acc;
    }, {} as CategoriedAnnouncementBreif);

    return categoriedList;
  }, [listData, readAnnouncementIds]);

  const hasUnread = useMemo(() => {
    return Object.values(list).some((item) => item.hasUnread);
  }, [list]);

  // 存在"未读且未自动弹窗提示过"的公告（用于加载时自动弹窗，避免每次刷新重复打扰）
  const hasUnprompted = useMemo(() => {
    return listData.some(
      (item) => !readAnnouncementIds.includes(item.id) && !promptedAnnouncementIds.includes(item.id)
    );
  }, [listData, readAnnouncementIds, promptedAnnouncementIds]);

  const loadList = useCallback(async () => {
    if (listAbortControllerRef.current) {
      listAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    listAbortControllerRef.current = abortController;

    setListLoading(true);
    setListError(null);

    try {
      const result = await service.dataService.announcementDataService.loadAnnouncementList({
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) return;

      setListData(result.sort((a, b) => b.published_at - a.published_at));
      return result;
    } catch (err) {
      if (err instanceof Error && (abortController.signal.aborted || err.name === 'AbortError')) return;
      setListError(err instanceof Error ? err : new Error('Failed to load announcement list'));
    } finally {
      if (!abortController.signal.aborted) {
        setListLoading(false);
        listAbortControllerRef.current = null;
      }
    }
  }, [service]);

  const loadDetail = useCallback(
    async (id: number) => {
      if (detailAbortControllerRef.current) {
        detailAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      detailAbortControllerRef.current = abortController;

      setDetailLoading(true);
      setDetailError(null);
      setDetail(undefined);

      try {
        const result = await service.dataService.announcementDataService.loadAnnouncementDetail(id, {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        setDetail(result);
        setRead(id);
      } catch (err) {
        if (err instanceof Error && (abortController.signal.aborted || err.name === 'AbortError')) return;
        setDetailError(err instanceof Error ? err : new Error('Failed to load announcement detail'));
      } finally {
        if (!abortController.signal.aborted) {
          setDetailLoading(false);
          detailAbortControllerRef.current = null;
        }
      }
    },
    [service]
  );

  // 仅加载列表，不自动预览最新公告详情。
  // 之前这里会 loadDetail(result[0].id)，而 loadDetail 会 setRead，
  // 导致最新公告在用户还没点开时就被标记为已读 —— 最新的不显示 "new"、
  // 图标也不出小红点。已读改为仅在用户点击具体公告时触发（见 loadDetail）。
  const refreshList = useCallback(async () => {
    return loadList();
  }, [loadList]);

  const setRead = useCallback((id: number) => {
    readAnnouncementLocalStorage.value = [...readAnnouncementLocalStorage.value, id];
  }, []);

  // 将当前列表全部记为"已自动提示过"。只影响自动弹窗去重，不影响已读/红点。
  const markPrompted = useCallback(() => {
    promptedAnnouncementLocalStorage.value = [
      ...new Set([...promptedAnnouncementLocalStorage.value, ...listData.map((item) => item.id)]),
    ];
  }, [listData]);

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

    detail,
    detailLoading,
    detailError,
    loadDetail,

    setRead,
    hasUnread,
    hasUnprompted,
    markPrompted,
  };
};
