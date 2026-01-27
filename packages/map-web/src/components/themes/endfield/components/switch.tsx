import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { Deco7Dots } from '@/components/common/icons';
import { cn } from '@/utils/style';

export interface EndfieldSwitchProps {
  value: boolean;
  onValueChange: (checked: boolean) => void;
  className?: string;
  label?: string;
  labelPosition?: 'left' | 'right';
}

export const EndfieldSquareSwitch = ({
  value,
  onValueChange,
  className,
  label,
  labelPosition = 'left',
}: EndfieldSwitchProps) => {
  return (
    <ButtonWithAudio className={cn('flex items-center gap-2', className)}>
      {labelPosition === 'left' && label && (
        <label className="text-xs" onClick={() => onValueChange(!value)}>
          {label}
        </label>
      )}
      {/* <input type="checkbox" checked={value} onChange={() => onValueChange(!value)} /> */}
      <div className="w-7 h-4 border border-[#707070] bg-[#313131] rounded-sm" onClick={() => onValueChange(!value)}>
        {/* 滑块 */}
        <div
          className={cn(
            'w-4 h-2.5 mt-0.5 bg-[#707070] rounded-xs transition-transform',
            value ? 'translate-x-2 bg-[#fffa00]' : 'translate-x-0.5'
          )}
        >
          <Deco7Dots className={cn('w-full h-full rotate-270', value && 'text-[#888888]')} />
        </div>
      </div>
      {labelPosition === 'right' && label && (
        <label className="text-xs" onClick={() => onValueChange(!value)}>
          {label}
        </label>
      )}
    </ButtonWithAudio>
  );
};
