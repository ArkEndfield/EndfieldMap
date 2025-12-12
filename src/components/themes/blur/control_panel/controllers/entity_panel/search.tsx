import { CloseIcon } from '@/components/common/icons';
import { cn } from '@/utils/style';

export interface SearchProps {
  value?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const Search: React.FC<SearchProps> = ({ value, placeholder, onValueChange, className }) => {
  const handleClear = () => {
    onValueChange?.('');
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/30 rounded-full" />

      {/* Input */}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          'w-full py-2 px-4 pl-10 pr-10',
          'bg-white/5 text-white text-sm',
          'rounded-xl',
          'border border-white/10',
          'outline-none transition-all duration-200',
          'placeholder:text-white/40',
          'focus:bg-white/10 focus:border-white/20'
        )}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'w-6 h-6 flex items-center justify-center',
            'rounded-full',
            'bg-white/10 hover:bg-white/20',
            'text-white/50 hover:text-white/70',
            'transition-all duration-200',
            'active:scale-95'
          )}
        >
          <CloseIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
