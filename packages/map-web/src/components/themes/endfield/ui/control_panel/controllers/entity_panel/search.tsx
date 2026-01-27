import { ButtonWithAudio } from '@/components/common/button_with_audio';
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
    <div className={cn('relative px-1', className)}>
      {/* Search icon */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-[0.1rem] border-[#5a5a5a] rounded-full transition-all duration-300 z-1 peer-focus:border-[#a0a0a0]" />

      {/* Input */}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="w-full py-1.5 px-4 pl-7 bg-[rgba(40,40,40,0.95)] text-[#e0e0e0] text-[0.7rem] outline-none transition-all duration-250 ease-in-out tracking-[0.5px] border border-[#3a3a3a] border-t-[#333333] border-l-[#333333] shadow-[0_0_0.3em_rgba(0,0,0,0.3),inset_0_0_8px_rgba(0,0,0,0.3)] placeholder:text-[#888888] placeholder:italic placeholder:transition-all placeholder:duration-300 placeholder:ease-in-out focus:bg-[rgba(45,45,45,0.98)] focus:border-[#444444] focus:border-t-[#3a3a3a] focus:border-l-[#3a3a3a] focus:shadow-[0_0_15px_rgba(50,50,50,0.3),inset_0_0_10px_rgba(60,60,60,0.2)] focus:placeholder:text-[#999999] focus:placeholder:translate-x-[5px]"
      />

      {/* Clear button */}
      {value && (
        <ButtonWithAudio
          onClick={handleClear}
          className="absolute right-[1.2em] top-1/2 -translate-y-1/2 w-[1.6em] h-[1.6em] flex items-center justify-center rounded-[3px] bg-linear-to-br from-[#1a1a1a] to-[#2a2a2a] text-[#a0a0a0] text-[0.9em] transition-all duration-200 border border-[#3a3a3a] hover:bg-linear-to-br hover:from-[#2a2a2a] hover:to-[#3a3a3a] hover:text-[#e0e0e0] hover:shadow-[0_0_10px_rgba(60,60,60,0.5)] active:bg-linear-to-br active:from-[#1a1a1a] active:to-[#2a2a2a] active:scale-[0.92] active:shadow-[0_0_5px_rgba(40,40,40,0.3)]"
        >
          <CloseIcon />
        </ButtonWithAudio>
      )}

      {/* Edge glow effect */}
      <div className="absolute top-0 left-1 right-[0.3em] bottom-0 rounded-md shadow-[0_0_2px_rgba(120,120,120,0.15)] pointer-events-none -z-1" />
    </div>
  );
};
