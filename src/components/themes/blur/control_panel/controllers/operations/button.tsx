import type { ReactNode } from 'react';

import { cn } from '@/utils/style';

export interface OperationButtonProps {
  icon?: ReactNode;
  subtitle?: string;
  title: ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export const OperationButton = ({ icon, subtitle, title, onClick, active }: OperationButtonProps) => {
  return (
    <button
      className={cn(
        'relative flex-1 px-3 py-2.5 text-center',
        'rounded-lg transition-all duration-200',
        'border border-white/10',
        'text-sm font-medium',
        active
          ? 'bg-blue-500/20 text-white border-blue-500/30 shadow-sm shadow-blue-500/20'
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white active:scale-95'
      )}
      onClick={onClick}
    >
      {/* Title */}
      <div className="flex items-center justify-center gap-1.5">
        {icon && <div className="shrink-0 flex items-center justify-center w-4 h-4">{icon}</div>}
        <div className="whitespace-nowrap">{title}</div>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className={cn('text-[10px] mt-0.5 uppercase tracking-wider', active ? 'text-white/60' : 'text-white/40')}>
          {subtitle}
        </div>
      )}
    </button>
  );
};
