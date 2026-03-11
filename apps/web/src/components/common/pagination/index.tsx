import { useTranslation } from 'react-i18next';
import { cn } from '@endfieldmap/tools';
import { Logo, LogoLoading, ZmdRoundButton, ZmdRoundIconButton } from '@endfieldmap/web-components';
import { useCallback, useMemo } from 'react';

import { ChevronUp } from '@endfieldmap/web-components';

export type PaginationLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface PaginationProps<T> {
  /** 当前页数据 */
  data: T[];
  /** 当前页码（从 1 开始） */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 加载状态 */
  loadStatus: PaginationLoadStatus;
  /** 错误信息 */
  errorMessage?: string;
  /** 加载函数，参数为页码 */
  onLoad: (page: number) => Promise<void>;
  /** 重试函数 */
  onRetry?: () => Promise<void>;
  /** 渲染函数，参数为数据 */
  renderItem: (data: T[]) => React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

interface PageButtonProps {
  page: number | 'ellipsis';
  currentPage: number;
  disabled: boolean;
  onClick: (page: number) => void;
}

const PageButton: React.FC<PageButtonProps> = ({ page, currentPage, disabled, onClick }) => {
  if (page === 'ellipsis') {
    return <span className="px-1 py-1 text-gray-400 select-none text-xs">...</span>;
  }

  const isActive = page === currentPage;

  return (
    <ZmdRoundIconButton
      disabled={disabled}
      onClick={() => onClick(page)}
      className={cn('text-xs', isActive && 'bg-[#fffa00] before:opacity-100')}
    >
      <span className="relative z-2">{page}</span>
    </ZmdRoundIconButton>
  );
};

/**
 * 生成页码数组
 * 规则：
 * - 总页数 <= 9：全部显示
 * - 总页数 > 9：显示 9 个页码，最多两处省略号
 *   - 前两页 [1, 2]
 *   - 后两页 [n-1, n]
 *   - 中间 5 个连续页码（包含当前页）
 */
const generatePageNumbers = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
  // 总页数 <= 9，全部显示
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // 中间区域需要 5 个连续页码，以当前页为中心
  // 中间区域的起始和结束位置
  let midStart = currentPage - 2;
  let midEnd = currentPage + 2;

  // 调整中间区域，确保有 5 个页码且不超出边界
  if (midStart < 1) {
    midStart = 1;
    midEnd = 5;
  }
  if (midEnd > totalPages) {
    midEnd = totalPages;
    midStart = totalPages - 4;
  }

  // 判断中间区域是否与前两页或后两页重叠
  const mergeWithStart = midStart <= 3; // 中间区域与前两页相连或重叠
  const mergeWithEnd = midEnd >= totalPages - 2; // 中间区域与后两页相连或重叠

  const result: (number | 'ellipsis')[] = [];

  if (mergeWithStart && mergeWithEnd) {
    // 两边都重叠，直接显示全部（理论上不会发生，因为 totalPages > 9）
    for (let i = 1; i <= totalPages; i++) {
      result.push(i);
    }
  } else if (mergeWithStart) {
    // 与前面重叠，扩展前面的范围
    // 显示: 1 2 3 4 5 6 7 ... n-1 n (共 9 个数字 + 1 个省略号)
    const extendedEnd = 9 - 2; // 前面显示 7 个，后面显示 2 个
    for (let i = 1; i <= extendedEnd; i++) {
      result.push(i);
    }
    result.push('ellipsis');
    result.push(totalPages - 1);
    result.push(totalPages);
  } else if (mergeWithEnd) {
    // 与后面重叠，扩展后面的范围
    // 显示: 1 2 ... n-6 n-5 n-4 n-3 n-2 n-1 n (共 9 个数字 + 1 个省略号)
    const extendedStart = totalPages - 6; // 后面显示 7 个，前面显示 2 个
    result.push(1);
    result.push(2);
    result.push('ellipsis');
    for (let i = extendedStart; i <= totalPages; i++) {
      result.push(i);
    }
  } else {
    // 两边都不重叠
    // 显示: 1 2 ... mid-2 mid-1 mid mid+1 mid+2 ... n-1 n
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

export function Pagination<T>({
  data,
  currentPage,
  totalPages,
  loadStatus,
  errorMessage,
  onLoad,
  onRetry,
  renderItem,
  className,
}: PaginationProps<T>) {
  const { t } = useTranslation(['common']);
  const isLoading = loadStatus === 'loading';
  const isError = loadStatus === 'error';

  const pageNumbers = useMemo(() => generatePageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page === currentPage || isLoading || page < 1 || page > totalPages) return;
      onLoad(page);
    },
    [currentPage, isLoading, totalPages, onLoad]
  );

  const handlePrev = useCallback(() => {
    handlePageChange(currentPage - 1);
  }, [currentPage, handlePageChange]);

  const handleNext = useCallback(() => {
    handlePageChange(currentPage + 1);
  }, [currentPage, handlePageChange]);

  // 左箭头图标（ChevronUp 旋转 -90deg）
  const leftArrowIcon = <ChevronUp className="-rotate-90 text-[0.5em]" />;
  // 右箭头图标（ChevronUp 旋转 90deg）
  const rightArrowIcon = <ChevronUp className="rotate-90 text-[0.5em]" />;

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <LogoLoading className="text-2xl" glowColor="#999999" />
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 gap-3">
            <Logo className="text-4xl text-red-500" />
            <div className="text-red-500 text-sm">
              {errorMessage || t('common:load_error', { defaultValue: '加载失败' })}
            </div>
            <ZmdRoundButton
              type="default"
              showIcon={false}
              onClick={() => (onRetry ? onRetry() : onLoad(currentPage))}
              className="text-xs min-w-20"
            >
              {t('common:retry', { defaultValue: '重试' })}
            </ZmdRoundButton>
          </div>
        )}
        {!isLoading && !isError && data.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Logo className="text-4xl" />
            <span className="text-sm">{t('common:no_data', { defaultValue: '暂无数据' })}</span>
          </div>
        ) : (
          renderItem(data)
        )}
      </div>

      {/* 分页控制区域 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 border-t border-gray-100 shrink-0">
          {/* 上一页 */}
          <ZmdRoundButton
            type="default"
            icon={leftArrowIcon}
            iconPosition="left"
            disabled={currentPage === 1 || isLoading}
            onClick={handlePrev}
            className="text-xs min-w-20"
          >
            {t('common:prev_page', { defaultValue: '上一页' })}
          </ZmdRoundButton>

          {/* 页码 */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => (
              <PageButton
                key={page === 'ellipsis' ? `ellipsis-${index}` : page}
                page={page}
                currentPage={currentPage}
                disabled={isLoading}
                onClick={handlePageChange}
              />
            ))}
          </div>

          {/* 下一页 */}
          <ZmdRoundButton
            type="default"
            icon={rightArrowIcon}
            iconPosition="right"
            disabled={currentPage === totalPages || isLoading}
            onClick={handleNext}
            className="text-xs min-w-20"
          >
            {t('common:next_page', { defaultValue: '下一页' })}
          </ZmdRoundButton>
        </div>
      )}
    </div>
  );
}

export default Pagination;
