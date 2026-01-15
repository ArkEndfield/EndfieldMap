import { useTranslation } from 'react-i18next';

import { ChevronUpTriangle } from '@/components/common/icons';
import { cn } from '@/utils/style';

export const FoldButton = ({
  open,
  onToggle,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  className?: string;
}) => {
  const { t } = useTranslation('sidebar');
  return (
    <button onClick={onToggle} className={cn('flex items-stretch h-5 text-xs text-[#3c3c3c]', className)}>
      {/* 文本 */}
      <div className={cn('bg-[#eee] flex justify-center items-center transition-all', open ? 'w-32' : 'w-24')}>
        <ChevronUpTriangle className={cn('transition-transform', open && 'rotate-180')} />
        {open ? t('fold') : t('unfold')}
      </div>
      {/* 装饰 */}
      <div className="flex items-center relative -z-1 w-0">
        {/** 三角形 */}
        <div
          className={cn(
            'w-0 h-0 border-10 border-[#eee] border-b-transparent border-l-transparent',
            open ? 'delay-50' : '-translate-x-full',
            'transition-transform'
          )}
        />
        <div
          className={cn(
            'w-0 h-0 border-10 border-[#eee] border-b-transparent border-l-transparent',
            !open && '-translate-x-[200%] delay-50',
            'transition-transform'
          )}
        />
      </div>
    </button>
  );
};
