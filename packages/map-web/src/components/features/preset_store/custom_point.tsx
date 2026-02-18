import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

import type { PresetStoreResponseItem } from '@/@types/preset_store';
import { Pagination } from '@/components/common/pagination';
import { PresetStoreItem } from '@/components/common/preset_store/item';
import { SearchSortToolbar } from '@/components/common/preset_store/search_sort_toolbar';
import { ScrollArea } from '@/components/common/scroll_area';
import { usePagination, useSearchSort } from '@/hooks/use_preset_store';
import { presetService } from '@/services/preset';
import { catchErrorWithTip } from '@/utils/handler';

interface CustomPointStoreProps {
  show: boolean;
  onOpen: (item: PresetStoreResponseItem) => void;
}

export const CustomPointStore = observer(({ show, onOpen }: CustomPointStoreProps) => {
  const prevShowRef = useRef(false);

  const { searchKeyword, setSearchKeyword, sortBy, setSortBy, sortOrder, setSortOrder } = useSearchSort();

  const fetchData = useCallback(
    async (page: number, pageSize: number): Promise<{ data: PresetStoreResponseItem[]; totalPages: number }> => {
      const result = await presetService.getCustomPointPresets(page, pageSize, {
        keyword: searchKeyword,
        sortBy,
        sortOrder,
      });
      return {
        data: result.list,
        totalPages: Math.ceil(result.count / pageSize) || 1,
      };
    },
    [searchKeyword, sortBy, sortOrder]
  );

  const { displayData, currentPage, totalPages, loadStatus, errorMessage, load, retry, optimistic } = usePagination(
    fetchData,
    { pageSize: 12 }
  );

  // 当 show 从 false 变为 true 时刷新数据
  useEffect(() => {
    const wasHidden = !prevShowRef.current;
    prevShowRef.current = show;

    if (show && wasHidden) {
      load(1);
    }
  }, [show, load]);

  // 搜索或排序条件变化时重新加载第一页（跳过首次，因为 show effect 会处理）
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
    [displayData, onOpen]
  );

  const handleLike = useCallback(
    async (id: number) => {
      const item = displayData.find((i) => i.id === id);
      if (!item) return;

      const newIsLiked = !item.is_liked;
      const newLikeCount = item.like_count + (newIsLiked ? 1 : -1);

      // 乐观更新
      optimistic.apply(id, {
        is_liked: newIsLiked,
        like_count: newLikeCount,
      });

      // 调用 API，失败时回滚
      await catchErrorWithTip(
        () => (newIsLiked ? presetService.likePreset(id) : presetService.unlikePreset(id)),
        () => {
          optimistic.revert(id);
        }
      );
    },
    [displayData, optimistic]
  );

  const renderItems = useCallback(
    (items: PresetStoreResponseItem[]) => (
      <ScrollArea className="h-full" contentClassName="grid grid-cols-2 gap-4 md:grid-cols-3 auto-rows-min p-4">
        {items.map((item) => (
          <PresetStoreItem key={item.id} item={item} onOpen={handleOpen} onLike={handleLike} />
        ))}
      </ScrollArea>
    ),
    [handleOpen, handleLike]
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex flex-col overflow-hidden"
        >
          {/* 搜索排序栏 */}
          <SearchSortToolbar
            onSearchChange={setSearchKeyword}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            onRefresh={() => load(currentPage)}
            isLoading={loadStatus === 'loading'}
            className="shrink-0 pt-3"
          />

          {/* 分页内容 */}
          <Pagination
            data={displayData}
            currentPage={currentPage}
            totalPages={totalPages}
            loadStatus={loadStatus}
            errorMessage={errorMessage}
            onLoad={load}
            onRetry={retry}
            renderItem={renderItems}
            className="flex-1"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});
