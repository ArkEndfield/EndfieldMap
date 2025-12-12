import { cn } from '@/utils/style';

export const SideButton = ({
  children,
  onClick,
  position = 'left',
  level = 0,
}: {
  children: React.ReactNode;
  onClick: () => void;
  position?: 'left' | 'right';
  level?: number;
}) => {
  // Calculate bottom position: base position + (button height + gap) * level
  // Button height 48px (h-12) + gap 8px = 56px
  const bottomOffset = 8 + level * 56; // 8px base + 56px * level

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-2 w-12 h-12 flex flex-col items-center justify-center rounded-xl text-xs p-1 text-white',
        'bg-black/40 backdrop-blur-2xl',
        'border border-white/20',
        'shadow-xl shadow-black/20',
        'active:bg-black/60 transition-colors',
        position === 'left' ? 'left-4' : 'right-4'
      )}
      style={{ bottom: `${bottomOffset}px` }}
    >
      {children}
    </button>
  );
};
