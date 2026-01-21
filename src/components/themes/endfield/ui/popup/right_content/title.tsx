import { DecoTriTriangle } from '@/components/common/icons';
import { cn } from '@/utils/style';

export interface SubPopupTitleProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  classNames?: {
    container?: string;
    icon?: string;
    content?: string;
  };
}

export const SubPopupTitle = ({
  children = 'Title',
  icon = <DecoTriTriangle />,
  className,
  classNames,
}: SubPopupTitleProps) => {
  return (
    <div
      className={cn(
        'flex border-b border-[#383938] text-[#979796] bg-[#272827] text-sm h-10 top-0 sticky items-center gap-2 pl-4 pr-2 z-2',
        className,
        classNames?.container
      )}
    >
      {icon && <div className={cn('w-4 h-4', classNames?.icon)}>{icon}</div>}
      <div className={cn('font-bold truncate', classNames?.content)}>{children}</div>
    </div>
  );
};
