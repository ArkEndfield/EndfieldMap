import type { PresetStoreResponseItem } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, View } from 'react-native';

import { Pagination } from '@/components/features/preset-store/pagination';
import { PresetStoreItem } from '@/components/features/preset-store/preset-store-item';
import { SearchSortToolbar } from '@/components/features/preset-store/search-sort-toolbar';
import { usePagination, useSearchSort } from '@/hooks/use-preset-store';
import { service } from '@/services/map-service';
import { catchErrorWithTip } from '@/utils/error-handler';

interface CustomPointStoreProps {
  show: boolean;
  onOpen: (item: PresetStoreResponseItem) => void;
}

export const CustomPointStore = observer(function CustomPointStore({
  show,
  onOpen,
}: CustomPointStoreProps) {
  const prevShowRef = useRef(false);

  const { searchKeyword, setSearchKeyword, sortBy, setSortBy, sortOrder, setSortOrder } =
    useSearchSort();

  const fetchData = useCallback(
    async (
      page: number,
      pageSize: number,
    ): Promise<{ data: PresetStoreResponseItem[]; totalPages: number }> => {
      const result = await service.presetService.getCustomPointPresets(page, pageSize, {
        keyword: searchKeyword,
        sortBy,
        sortOrder,
      });
      return {
        data: result.list,
        totalPages: Math.ceil(result.count / pageSize) || 1,
      };
    },
    [searchKeyword, sortBy, sortOrder],
  );

  const { displayData, currentPage, totalPages, loadStatus, errorMessage, load, retry, optimistic } =
    usePagination(fetchData, { pageSize: 12 });

  useEffect(() => {
    const wasHidden = !prevShowRef.current;
    prevShowRef.current = show;

    if (show && wasHidden) {
      load(1);
    }
  }, [show, load]);

  const isFirstFilterChange = useRef(true);
  useEffect(() => {
    if (isFirstFilterChange.current) {
      isFirstFilterChange.current = false;
      return;
    }
    if (show) {
      load(1);
    }
  }, [searchKeyword, sortBy, sortOrder, show, load]);

  const handleOpen = useCallback(
    (id: number) => {
      const item = displayData.find((i) => i.id === id);
      if (item) onOpen(item);
    },
    [displayData, onOpen],
  );

  const handleLike = useCallback(
    async (id: number) => {
      const item = displayData.find((i) => i.id === id);
      if (!item) return;

      const newIsLiked = !item.is_liked;
      const newLikeCount = item.like_count + (newIsLiked ? 1 : -1);

      optimistic.apply(id, {
        is_liked: newIsLiked,
        like_count: newLikeCount,
      });

      await catchErrorWithTip(
        () =>
          newIsLiked
            ? service.presetService.likePreset(id)
            : service.presetService.unlikePreset(id),
        () => {
          optimistic.revert(id);
        },
      );
    },
    [displayData, optimistic],
  );

  const renderItem = useCallback(
    ({ item }: { item: PresetStoreResponseItem }) => (
      <PresetStoreItem item={item} onOpen={handleOpen} onLike={handleLike} />
    ),
    [handleOpen, handleLike],
  );

  const renderItems = useCallback(
    (items: PresetStoreResponseItem[]) => (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperClassName="gap-3 px-3"
        contentContainerClassName="gap-3 pb-2 pt-1"
        showsVerticalScrollIndicator={false}
      />
    ),
    [renderItem],
  );

  return (
    <View className="flex-1">
      {/* Search sort toolbar */}
      <SearchSortToolbar
        onSearchChange={setSearchKeyword}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onRefresh={() => load(currentPage)}
        isLoading={loadStatus === 'loading'}
      />

      {/* Paginated content */}
      <Pagination
        data={displayData}
        currentPage={currentPage}
        totalPages={totalPages}
        loadStatus={loadStatus}
        errorMessage={errorMessage}
        onLoad={load}
        onRetry={retry}
        renderItem={renderItems}
      />
    </View>
  );
});
