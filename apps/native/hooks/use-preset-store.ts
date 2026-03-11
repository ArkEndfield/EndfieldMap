import type { MineTab, PresetStoreResponseItem, PresetStoreSearchOptions, PresetType } from '@endfieldmap/map-service';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { service } from '@/services/map-service';
import { catchErrorWithTip } from '@/utils/error-handler';

// ============================================================================
// 类型定义
// ============================================================================

export type PaginationLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UsePaginationOptions<T> {
  initialPage?: number;
  pageSize?: number;
  getItemId?: (item: T) => string | number;
}

export interface UseSearchSortOptions {
  defaultSortBy?: PresetStoreSearchOptions['sortBy'];
  defaultSortOrder?: PresetStoreSearchOptions['sortOrder'];
}

export interface UseMineStoreOptions {
  show: boolean;
  onOpen: (item: PresetStoreResponseItem) => void;
}

// ============================================================================
// useOptimisticList
// ============================================================================

export type OptimisticOperation<T> = { type: 'update'; data: Partial<T> } | { type: 'remove' };

export function useOptimisticList<T extends { id: string | number }>(
  getItemId: (item: T) => string | number = (item) => item.id,
) {
  const [operations, setOperations] = useState<Map<string | number, OptimisticOperation<T>>>(() => new Map());

  const getItemIdRef = useRef(getItemId);
  getItemIdRef.current = getItemId;

  const apply = useCallback((id: string | number, updates: Partial<T>) => {
    setOperations((prev) => {
      const next = new Map(prev);
      next.set(id, { type: 'update', data: updates });
      return next;
    });
  }, []);

  const remove = useCallback((id: string | number) => {
    setOperations((prev) => {
      const next = new Map(prev);
      next.set(id, { type: 'remove' });
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setOperations(new Map());
  }, []);

  const revert = useCallback((id: string | number) => {
    setOperations((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const merge = useCallback(
    (data: T[]): T[] => {
      if (operations.size === 0) return data;

      return data
        .map((item) => {
          const id = getItemIdRef.current(item);
          const operation = operations.get(id);

          if (!operation) return item;

          if (operation.type === 'remove') {
            return null;
          }

          return { ...item, ...operation.data };
        })
        .filter((item): item is T => item !== null);
    },
    [operations],
  );

  const hasPending = operations.size > 0;

  const getOperation = useCallback((id: string | number) => operations.get(id), [operations]);

  return useMemo(
    () => ({
      apply,
      remove,
      clear,
      revert,
      merge,
      hasPending,
      getOperation,
    }),
    [apply, remove, clear, revert, merge, hasPending, getOperation],
  );
}

// ============================================================================
// usePagination
// ============================================================================

export function usePagination<T extends { id: string | number }>(
  fetchData: (page: number, pageSize: number) => Promise<{ data: T[]; totalPages: number }>,
  options: UsePaginationOptions<T> = {},
) {
  const { initialPage = 1, pageSize = 10, getItemId = (item: T) => item.id } = options;

  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loadStatus, setLoadStatus] = useState<PaginationLoadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>();
  const previousPageRef = useRef(initialPage);
  const failedTargetPageRef = useRef<number | null>(null);
  const currentPageRef = useRef(currentPage);
  const fetchDataRef = useRef(fetchData);
  const optimistic = useOptimisticList<T>(getItemId);
  const clearOptimisticRef = useRef(optimistic.clear);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    clearOptimisticRef.current = optimistic.clear;
  }, [optimistic.clear]);

  const load = useCallback(
    async (page: number) => {
      previousPageRef.current = currentPageRef.current;
      failedTargetPageRef.current = null;
      setCurrentPage(page);
      setLoadStatus('loading');
      setErrorMessage(undefined);

      clearOptimisticRef.current();

      try {
        const result = await fetchDataRef.current(page, pageSize);
        setData(result.data);
        setTotalPages(result.totalPages);
        setLoadStatus('success');
      } catch (error) {
        failedTargetPageRef.current = page;
        setCurrentPage(previousPageRef.current);
        setLoadStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '加载失败');
      }
    },
    [pageSize],
  );

  const retry = useCallback(() => {
    const targetPage = failedTargetPageRef.current ?? currentPageRef.current;
    return load(targetPage);
  }, [load]);

  const displayData = useMemo(() => optimistic.merge(data), [optimistic, data]);

  return useMemo(
    () => ({
      data,
      displayData,
      currentPage,
      totalPages,
      loadStatus,
      errorMessage,
      pageSize,
      load,
      retry,
      optimistic,
    }),
    [data, displayData, currentPage, totalPages, loadStatus, errorMessage, pageSize, load, retry, optimistic],
  );
}

// ============================================================================
// useSearchSort
// ============================================================================

export function useSearchSort(options: UseSearchSortOptions = {}) {
  const { defaultSortBy = 'like_count', defaultSortOrder = 'desc' } = options;

  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<PresetStoreSearchOptions['sortBy']>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<PresetStoreSearchOptions['sortOrder']>(defaultSortOrder);

  return {
    searchKeyword,
    setSearchKeyword,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  };
}

// ============================================================================
// useMineStore
// ============================================================================

export function useMineStore({ show, onOpen }: UseMineStoreOptions) {
  const [activeTab, setActiveTab] = useState<MineTab>('uploads');
  const [presetType, setPresetType] = useState<PresetType>('electric_pole');

  const prevShowRef = useRef(false);

  const fetchUploadsData = useCallback(
    async (page: number, pageSize: number): Promise<{ data: PresetStoreResponseItem[]; totalPages: number }> => {
      const result = await service.presetService.getMineSharePresets(page, pageSize, presetType);
      return {
        data: result.list,
        totalPages: Math.ceil(result.count / pageSize) || 1,
      };
    },
    [presetType],
  );

  const fetchFavoritesData = useCallback(
    async (page: number, pageSize: number): Promise<{ data: PresetStoreResponseItem[]; totalPages: number }> => {
      const result = await service.presetService.getMineLikedPresets(page, pageSize, presetType);
      return {
        data: result.list,
        totalPages: Math.ceil(result.count / pageSize) || 1,
      };
    },
    [presetType],
  );

  const uploadsPagination = usePagination(fetchUploadsData, { pageSize: 12 });
  const favoritesPagination = usePagination(fetchFavoritesData, { pageSize: 12 });

  const { load: loadUploads } = uploadsPagination;
  const { load: loadFavorites } = favoritesPagination;

  useEffect(() => {
    const wasHidden = !prevShowRef.current;
    prevShowRef.current = show;

    if (show && wasHidden) {
      if (activeTab === 'uploads') {
        loadUploads(1);
      } else {
        loadFavorites(1);
      }
    }
  }, [show, activeTab, loadUploads, loadFavorites]);

  const isFirstLoadRef = useRef(true);
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }
    if (show) {
      if (activeTab === 'uploads') {
        loadUploads(1);
      } else {
        loadFavorites(1);
      }
    }
  }, [presetType, show, activeTab, loadUploads, loadFavorites]);

  const handleTabChange = useCallback((tab: MineTab) => {
    setActiveTab(tab);
  }, []);

  const handleOpen = useCallback(
    (id: number) => {
      const currentData = activeTab === 'uploads' ? uploadsPagination.displayData : favoritesPagination.displayData;
      const item = currentData.find((i) => i.id === id);
      if (item) onOpen(item);
    },
    [activeTab, uploadsPagination.displayData, favoritesPagination.displayData, onOpen],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      const result = await catchErrorWithTip(() => service.presetService.deleteSharePreset(id));

      if (result !== false) {
        const { currentPage, totalPages, displayData, load } = uploadsPagination;
        const shouldGoToPrevPage = displayData.length === 1 && currentPage > 1 && currentPage === totalPages;
        load(shouldGoToPrevPage ? currentPage - 1 : currentPage);
      }
    },
    [uploadsPagination],
  );

  const handleLike = useCallback(
    async (id: number) => {
      if (activeTab === 'uploads') {
        const item = uploadsPagination.displayData.find((i) => i.id === id);
        if (!item) return;

        const newIsLiked = !item.is_liked;
        const newLikeCount = item.like_count + (newIsLiked ? 1 : -1);

        uploadsPagination.optimistic.apply(id, {
          is_liked: newIsLiked,
          like_count: newLikeCount,
        });

        await catchErrorWithTip(
          () => (newIsLiked ? service.presetService.likePreset(id) : service.presetService.unlikePreset(id)),
          () => {
            uploadsPagination.optimistic.revert(id);
          },
        );
      } else {
        const result = await catchErrorWithTip(() => service.presetService.unlikePreset(id));

        if (result !== false) {
          const { currentPage, totalPages, displayData, load } = favoritesPagination;
          const shouldGoToPrevPage = displayData.length === 1 && currentPage > 1 && currentPage === totalPages;
          load(shouldGoToPrevPage ? currentPage - 1 : currentPage);
        }
      }
    },
    [activeTab, uploadsPagination, favoritesPagination],
  );

  const handleRefresh = useCallback(() => {
    if (activeTab === 'uploads') {
      uploadsPagination.load(uploadsPagination.currentPage);
    } else {
      favoritesPagination.load(favoritesPagination.currentPage);
    }
  }, [activeTab, uploadsPagination, favoritesPagination]);

  const handleEdit = useCallback(
    async (id: number, editData: { name: string; description: string; is_public: boolean }) => {
      const result = await catchErrorWithTip(async () => {
        await service.presetService.updateSharePreset(id, editData);
      });

      if (result !== false) {
        uploadsPagination.load(uploadsPagination.currentPage);
      }

      return result !== false;
    },
    [uploadsPagination],
  );

  return {
    activeTab,
    presetType,
    uploadsPagination,
    favoritesPagination,
    setPresetType,
    handleTabChange,
    handleOpen,
    handleDelete,
    handleLike,
    handleRefresh,
    handleEdit,
  };
}
