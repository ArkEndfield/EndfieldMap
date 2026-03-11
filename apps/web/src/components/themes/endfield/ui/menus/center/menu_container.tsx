import { cn } from '@endfieldmap/tools';

export const MenuContainer = ({
  children,
  rightBorder,
  className,
}: {
  children: React.ReactNode;
  rightBorder?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      'relative text-xl flex-1 flex items-center justify-center',
      rightBorder &&
        'after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-4 after:bg-white/25',
      className
    )}
  >
    {children}
  </div>
);
