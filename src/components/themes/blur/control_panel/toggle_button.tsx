import { cn } from '@/utils/style';

interface ToggleButtonProps {
  open: boolean;
  onToggle: () => void;
}

export default function ToggleButton({ open, onToggle }: ToggleButtonProps) {
  return (
    <button
      className={cn(
        'absolute left-full top-20 z-10',
        'w-8 h-16 rounded-r-2xl',
        'bg-black/60 backdrop-blur-[40px]',
        'border border-l-0 border-white/20',
        'shadow-xl shadow-black/20',
        'flex items-center justify-center',
        'text-white hover:text-white hover:bg-black/70',
        'transition-colors duration-200',
        'active:scale-95 group'
      )}
      onClick={onToggle}
    >
      <svg
        className={cn(
          'w-5 h-5 transition-transform duration-300',
          open ? 'rotate-0' : 'rotate-180',
          'group-hover:scale-110'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
