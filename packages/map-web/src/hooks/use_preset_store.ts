/**
 * 预设商店相关 Hooks
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MineTab, PresetStoreResponseItem, PresetStoreSearchOptions, PresetType } from '@eftypes/preset_store';
import type { PaginationLoadStatus } from '@/components/common/pagination';
import { presetService } from '@/services/preset';
import { catchErrorWithTip } from '@/utils/handler';

// ============================================================================
// 类型定义
// ============================================================================

export interface UsePaginationOptions<T> {
  /** 初始页码，默认 1 */
  initialPage?: number;
  /** 每页数量，默认 10 */
  pageSize?: number;
  /** 获取数据项的唯一标识，默认使用 id 字段 */
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
// useOptimisticList - 通用乐观更新 Hook
// ============================================================================

/**
 * 乐观更新操作类型
 */
export type OptimisticOperation<T> = { type: 'update'; data: Partial<T> } | { type: 'remove' };

/**
 * 通用乐观更新 Hook
 *
 * 用于管理列表数据的乐观更新状态。
 * 乐观更新是指在 API 请求完成前，先在 UI 上显示预期的结果，
 * 提升用户体验。
 *
 * @template T - 数据项类型
 * @param getItemId - 获取数据项唯一标识的函数，默认使用 id 字段
 */
export function useOptimisticList<T extends { id: string | number }>(
  getItemId: (item: T) => string | number = (item) => item.id
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
    [operations]
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
    [apply, remove, clear, revert, merge, hasPending, getOperation]
  );
}

// ============================================================================
// usePagination - 分页数据加载 Hook（集成乐观更新）
// ============================================================================

/**
 * 分页数据加载 Hook
 *
 * 封装了分页状态管理、加载逻辑和乐观更新。
 * 每次加载新数据时会自动清空乐观更新状态。
 */
export function usePagination<T extends { id: string | number }>(
  fetchData: (page: number, pageSize: number) => Promise<{ data: T[]; totalPages: number }>,
  options: UsePaginationOptions<T> = {}
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

  // 使用 useEffect 更新 refs，避免在渲染期间更新
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
    [pageSize]
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
    [data, displayData, currentPage, totalPages, loadStatus, errorMessage, pageSize, load, retry, optimistic]
  );
}

// ============================================================================
// useSearchSort - 搜索排序 Hook
// ============================================================================

/**
 * 搜索排序 Hook
 * 封装搜索和排序状态管理
 */
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
// useMineStore - 「我的」页面状态管理 Hook
// ============================================================================

/**
 * 「我的」页面状态管理 Hook
 * 管理「我的上传」和「我的收藏」两个 tab 的状态和操作
 * 注意：Mine 页面不支持搜索和子类型筛选
 */
export function useMineStore({ show, onOpen }: UseMineStoreOptions) {
  const [activeTab, setActiveTab] = useState<MineTab>('uploads');
  const [presetType, setPresetType] = useState<PresetType>('electric_pole');

  // 记录上一次的 show 状态，用于检测从隐藏变为显示
  const prevShowRef = useRef(false);

  const fetchUploadsData = useCallback(
    async (page: number, pageSize: number): Promise<{ data: PresetStoreResponseItem[]; totalPages: number }> => {
      const result = await presetService.getMineSharePresets(page, pageSize, presetType);
      return {
        data: result.list,
        totalPages: Math.ceil(result.count / pageSize) || 1,
      };
    },
    [presetType]
  );

  const fetchFavoritesData = useCallback(
    async (page: number, pageSize: number): Promise<{ data: PresetStoreResponseItem[]; totalPages: number }> => {
      const result = await presetService.getMineLikedPresets(page, pageSize, presetType);
      return {
        data: result.list,
        totalPages: Math.ceil(result.count / pageSize) || 1,
      };
    },
    [presetType]
  );

  const uploadsPagination = usePagination(fetchUploadsData, { pageSize: 12 });
  const favoritesPagination = usePagination(fetchFavoritesData, { pageSize: 12 });

  const { load: loadUploads } = uploadsPagination;
  const { load: loadFavorites } = favoritesPagination;

  // 当 show 从 false 变为 true 时，刷新当前 tab 的数据
  useEffect(() => {
    const wasHidden = !prevShowRef.current;
    prevShowRef.current = show;

    if (show && wasHidden) {
      // 从隐藏变为显示，刷新当前 tab
      if (activeTab === 'uploads') {
        loadUploads(1);
      } else {
        loadFavorites(1);
      }
    }
  }, [show, activeTab, loadUploads, loadFavorites]);

  // 预设类型变化时重新加载第一页
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
    [activeTab, uploadsPagination.displayData, favoritesPagination.displayData, onOpen]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      const result = await catchErrorWithTip(() => presetService.deleteSharePreset(id));

      if (result !== false) {
        // 成功后重新加载，处理页数边界情况
        const { currentPage, totalPages, displayData, load } = uploadsPagination;
        // 如果当前页只剩一条数据且不是第一页，删除后应该跳到上一页
        const shouldGoToPrevPage = displayData.length === 1 && currentPage > 1 && currentPage === totalPages;
        load(shouldGoToPrevPage ? currentPage - 1 : currentPage);
      }
    },
    [uploadsPagination]
  );

  const handleLike = useCallback(
    async (id: number) => {
      if (activeTab === 'uploads') {
        const item = uploadsPagination.displayData.find((i) => i.id === id);
        if (!item) return;

        const newIsLiked = !item.is_liked;
        const newLikeCount = item.like_count + (newIsLiked ? 1 : -1);

        // 乐观更新
        uploadsPagination.optimistic.apply(id, {
          is_liked: newIsLiked,
          like_count: newLikeCount,
        });

        // 调用 API，失败时回滚
        await catchErrorWithTip(
          () => (newIsLiked ? presetService.likePreset(id) : presetService.unlikePreset(id)),
          () => {
            uploadsPagination.optimistic.revert(id);
          }
        );
      } else {
        // 在收藏页面取消点赞 = 移除收藏，不需要乐观更新
        const result = await catchErrorWithTip(() => presetService.unlikePreset(id));

        if (result !== false) {
          // 成功后重新加载，处理页数边界情况
          const { currentPage, totalPages, displayData, load } = favoritesPagination;
          const shouldGoToPrevPage = displayData.length === 1 && currentPage > 1 && currentPage === totalPages;
          load(shouldGoToPrevPage ? currentPage - 1 : currentPage);
        }
      }
    },
    [activeTab, uploadsPagination, favoritesPagination]
  );

  const handleRefresh = useCallback(() => {
    if (activeTab === 'uploads') {
      uploadsPagination.load(uploadsPagination.currentPage);
    } else {
      favoritesPagination.load(favoritesPagination.currentPage);
    }
  }, [activeTab, uploadsPagination, favoritesPagination]);

  const handleEdit = useCallback(
    async (id: number, data: { name: string; description: string; is_public: boolean }) => {
      const result = await catchErrorWithTip(async () => {
        await presetService.updateSharePreset(id, data);
      });

      if (result !== false) {
        uploadsPagination.load(uploadsPagination.currentPage);
      }

      return result !== false;
    },
    [uploadsPagination]
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
