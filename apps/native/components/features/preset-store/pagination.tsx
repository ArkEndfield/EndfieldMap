import type { PaginationLoadStatus } from '@/hooks/use-preset-store';
import { cn } from '@endfieldmap/tools';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export interface PaginationProps<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  loadStatus: PaginationLoadStatus;
  errorMessage?: string;
  onLoad: (page: number) => Promise<void>;
  onRetry?: () => Promise<void>;
  renderItem: (data: T[]) => React.ReactNode;
}

/**
 * Generate page number array.
 * - totalPages <= 9: show all
 * - totalPages > 9: show 9 page numbers with up to 2 ellipsis sections
 */
const generatePageNumbers = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let midStart = currentPage - 2;
  let midEnd = currentPage + 2;

  if (midStart < 1) {
    midStart = 1;
    midEnd = 5;
  }
  if (midEnd > totalPages) {
    midEnd = totalPages;
    midStart = totalPages - 4;
  }

  const mergeWithStart = midStart <= 3;
  const mergeWithEnd = midEnd >= totalPages - 2;

  const result: (number | 'ellipsis')[] = [];

  if (mergeWithStart && mergeWithEnd) {
    for (let i = 1; i <= totalPages; i++) {
      result.push(i);
    }
  } else if (mergeWithStart) {
    const extendedEnd = 9 - 2;
    for (let i = 1; i <= extendedEnd; i++) {
      result.push(i);
    }
    result.push('ellipsis');
    result.push(totalPages - 1);
    result.push(totalPages);
  } else if (mergeWithEnd) {
    const extendedStart = totalPages - 6;
    result.push(1);
    result.push(2);
    result.push('ellipsis');
    for (let i = extendedStart; i <= totalPages; i++) {
      result.push(i);
    }
  } else {
    result.push(1);
    result.push(2);
    result.push('ellipsis');
    for (let i = midStart; i <= midEnd; i++) {
      result.push(i);
    }
    result.push('ellipsis');
    result.push(totalPages - 1);
    result.push(totalPages);
  }

  return result;
};

function PageButton({
  page,
  currentPage,
  disabled,
  onPress,
}: {
  page: number | 'ellipsis';
  currentPage: number;
  disabled: boolean;
  onPress: (page: number) => void;
}) {
  if (page === 'ellipsis') {
    return (
      <View className="items-center justify-center px-1">
        <Text className="text-xs text-text-muted">...</Text>
      </View>
    );
  }

  const isActive = page === currentPage;

  return (
    <Pressable
      className={cn(
        'h-7 min-w-[28px] items-center justify-center rounded-md',
        isActive ? 'bg-primary' : 'bg-bg-tertiary',
      )}
      disabled={disabled}
      onPress={() => onPress(page)}
    >
      <Text className={cn('text-xs font-medium', isActive ? 'text-white' : 'text-text-secondary')}>
        {page}
      </Text>
    </Pressable>
  );
}

export function Pagination<T>({
  data,
  currentPage,
  totalPages,
  loadStatus,
  errorMessage,
  onLoad,
  onRetry,
  renderItem,
}: PaginationProps<T>) {
  const { t } = useTranslation(['common']);
  const isLoading = loadStatus === 'loading';
  const isError = loadStatus === 'error';

  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page === currentPage || isLoading || page < 1 || page > totalPages) return;
      onLoad(page);
    },
    [currentPage, isLoading, totalPages, onLoad],
  );

  const handlePrev = useCallback(() => {
    handlePageChange(currentPage - 1);
  }, [currentPage, handlePageChange]);

  const handleNext = useCallback(() => {
    handlePageChange(currentPage + 1);
  }, [currentPage, handlePageChange]);

  return (
    <View className="flex-1">
      {/* Content area */}
      <View className="flex-1">
        {isLoading && (
          <View className="absolute inset-0 z-10 items-center justify-center bg-bg-primary/70">
            <ActivityIndicator size="small" color="#007AFF" />
            <Text className="mt-2 text-sm text-text-muted">
              {t('common:loading', { defaultValue: '加载中...' })}
            </Text>
          </View>
        )}

        {isError && (
          <View className="absolute inset-0 z-10 items-center justify-center bg-bg-primary/90">
            <Text className="mb-3 text-sm text-error">
              {errorMessage || t('common:load_error', { defaultValue: '加载失败' })}
            </Text>
            <Pressable
              className="rounded-lg bg-primary px-4 py-2"
              onPress={() => (onRetry ? onRetry() : onLoad(currentPage))}
            >
              <Text className="text-sm font-medium text-white">
                {t('common:retry', { defaultValue: '重试' })}
              </Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !isError && data.length === 0 ? (
          <View className="flex-1 items-center justify-center py-16">
            <Text className="text-sm text-text-muted">
              {t('common:no_data', { defaultValue: '暂无数据' })}
            </Text>
          </View>
        ) : (
          renderItem(data)
        )}
      </View>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <View className="flex-row items-center justify-center gap-1 border-t border-border-light px-3 py-2.5">
          <Pressable
            className={cn(
              'flex-row items-center gap-0.5 rounded-md px-2.5 py-1.5',
              currentPage === 1 || isLoading ? 'opacity-40' : 'bg-bg-tertiary',
            )}
            disabled={currentPage === 1 || isLoading}
            onPress={handlePrev}
          >
            <MaterialIcons name="chevron-left" size={14} color="#666" />
            <Text className="text-xs text-text-secondary">
              {t('common:prev_page', { defaultValue: '上一页' })}
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-0.5">
            {pageNumbers.map((page, index) => (
              <PageButton
                key={page === 'ellipsis' ? `ellipsis-${index}` : page}
                page={page}
                currentPage={currentPage}
                disabled={isLoading}
                onPress={handlePageChange}
              />
            ))}
          </View>

          <Pressable
            className={cn(
              'flex-row items-center gap-0.5 rounded-md px-2.5 py-1.5',
              currentPage === totalPages || isLoading ? 'opacity-40' : 'bg-bg-tertiary',
            )}
            disabled={currentPage === totalPages || isLoading}
            onPress={handleNext}
          >
            <Text className="text-xs text-text-secondary">
              {t('common:next_page', { defaultValue: '下一页' })}
            </Text>
            <MaterialIcons name="chevron-right" size={14} color="#666" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
