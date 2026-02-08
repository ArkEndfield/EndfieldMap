import type { InputProps } from '@themes/types/input';
import { useState } from 'react';

import { VisibleIcon, InVisibleIcon } from '@/components/common/icons';
import { SoundType } from '@/const/audio_config';
import { useAudio } from '@/hooks/use_audio';
import { cn } from '@/utils/style';
import { ButtonWithAudio } from '@/components/common/button_with_audio';

export const EndfieldInput = ({
  placeholder,
  defaultValue = '',
  inputType = 'text',
  maxLength,
  minLength,
  pattern,
  inputClassName,
  onValueChange,
  content,
  disabled,
  soundType = SoundType.TICK,
}: InputProps) => {
  const [value, setValue] = useState(defaultValue);
  const [showPassword, setShowPassword] = useState(false);
  const { play } = useAudio();

  return (
    <div className="flex flex-col gap-3">
      {content && <div>{content}</div>}
      <div className="relative">
        <input
          type={inputType === 'password' && showPassword ? 'text' : inputType}
          className={cn(
            'px-3 py-1.5 outline-none transition-all duration-200 text-sm w-full',
            'bg-[#e8e6e6] text-[#2a2728] placeholder-[#a0a2a3]',
            'rounded-full',
            'shadow-[inset_0_0_3px_#b9b9b9]',
            !disabled && 'hover:bg-[#f0f0f0] hover:shadow-[inset_0_0_0_1px_#fefefe,0_0_4px_rgba(0,0,0,0.3)]',
            !disabled && 'active:bg-[#cfcdcd] active:shadow-[inset_0_0_3px_#b9b9b9]',
            !disabled && 'focus:bg-[#e8e6e6] focus:shadow-[inset_0_0_3px_#b9b9b9]',
            disabled && 'cursor-not-allowed opacity-50',
            inputType === 'password' && 'pr-8',
            '[&::-ms-reveal]:hidden [&::-ms-clear]:hidden',
            inputClassName
          )}
          onClick={() => {
            if (!disabled) {
              play(soundType);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value);
            onValueChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const confirmBtn = document.querySelector<HTMLButtonElement>('[data-alert-confirm]');
              confirmBtn?.click();
            }
          }}
        />
        {inputType === 'password' && (
          <ButtonWithAudio
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a0a2a3] hover:text-[#2a2728] transition-colors cursor-pointer outline-none"
            onClick={(e) => {
              e.stopPropagation();
              setShowPassword(!showPassword);
            }}
          >
            {showPassword ? <VisibleIcon /> : <InVisibleIcon />}
          </ButtonWithAudio>
        )}
      </div>
    </div>
  );
};

export default EndfieldInput;
