import type { PresetStoreSearchOptions } from '@endfieldmap/map-service';
import { useTranslation } from '@endfieldmap/map-service';
import { debounce } from '@endfieldmap/tools';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { EndfieldInput, EndfieldSelect, ZmdRoundIconButton } from '@endfieldmap/web-components';
import { ChevronUpTriangle, RefreshIcon } from '@/components/common/icons';
import { cn } from '@endfieldmap/tools';

export interface SearchSortToolbarProps {
  /** 搜索关键词变化回调 */
  onSearchChange: (keyword: string) => void;
  /** 排序字段 */
  sortBy: PresetStoreSearchOptions['sortBy'];
  /** 排序字段变化回调 */
  onSortByChange: (sortBy: PresetStoreSearchOptions['sortBy']) => void;
  /** 排序顺序 */
  sortOrder: PresetStoreSearchOptions['sortOrder'];
  /** 排序顺序变化回调 */
  onSortOrderChange: (order: PresetStoreSearchOptions['sortOrder']) => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 搜索防抖延迟（毫秒），默认 500 */
  debounceDelay?: number;
}

const SORT_BY_OPTIONS: { value: NonNullable<PresetStoreSearchOptions['sortBy']>; label: string }[] = [
  { value: 'like_count', label: '热度' },
  { value: 'created_at', label: '时间' },
];

export const SearchSortToolbar: React.FC<SearchSortToolbarProps> = ({
  onSearchChange,
  sortBy = 'like_count',
  onSortByChange,
  sortOrder = 'desc',
  onSortOrderChange,
  onRefresh,
  isLoading = false,
  className,
  debounceDelay = 500,
}) => {
  const { t } = useTranslation(['common']);

  // 使用 ref 保存防抖函数
  const debouncedSearchRef = useRef<ReturnType<typeof debounce<[string], void>> | null>(null);

  // 初始化防抖函数
  useEffect(() => {
    debouncedSearchRef.current = debounce((keyword: string) => {
      onSearchChange(keyword);
    }, debounceDelay);
  }, [onSearchChange, debounceDelay]);

  // 处理输入变化
  const handleValueChange = useCallback((value: string) => {
    debouncedSearchRef.current?.(value);
  }, []);

  const toggleSortOrder = useCallback(() => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, onSortOrderChange]);

  const sortOptions = useMemo(
    () =>
      SORT_BY_OPTIONS.map((opt) => ({
        ...opt,
        label: t(`common:sort.${opt.value}`, { defaultValue: opt.label }),
      })),
    [t]
  );

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2', className)}>
      {/* 搜索框 */}
      <div className="flex-1 min-w-0">
        <EndfieldInput
          placeholder={t('common:search_placeholder', { defaultValue: '搜索...' })}
          onValueChange={handleValueChange}
          inputClassName="text-xs py-1"
        />
      </div>

      {/* 排序选择 */}
      <div className="shrink-0 w-24">
        <EndfieldSelect
          options={sortOptions}
          value={sortBy}
          onChange={onSortByChange}
          classNames={{
            trigger: 'text-xs py-1',
            option: 'text-xs',
          }}
        />
      </div>

      {/* 排序顺序切换 */}
      <ZmdRoundIconButton
        onClick={toggleSortOrder}
        className="shrink-0"
        title={
          sortOrder === 'asc'
            ? t('common:sort.asc', { defaultValue: '升序' })
            : t('common:sort.desc', { defaultValue: '降序' })
        }
      >
        <ChevronUpTriangle
          className={cn('relative z-2 transition-transform duration-200', sortOrder === 'desc' && 'rotate-180')}
        />
      </ZmdRoundIconButton>

      {/* 刷新按钮 */}
      {onRefresh && (
        <ZmdRoundIconButton
          onClick={onRefresh}
          className="shrink-0"
          disabled={isLoading}
          title={t('common:refresh', { defaultValue: '刷新' })}
        >
          <RefreshIcon className={cn('relative z-2 transition-transform duration-200', isLoading && 'animate-spin')} />
        </ZmdRoundIconButton>
      )}
    </div>
  );
};

export default SearchSortToolbar;
