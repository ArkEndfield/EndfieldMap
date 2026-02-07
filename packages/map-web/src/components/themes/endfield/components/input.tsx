import type { InputProps } from '@themes/types/input';
import { useState } from 'react';

import { cn } from '@/utils/style';

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
}: InputProps) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-3">
      {content && <div>{content}</div>}
      <input
        type={inputType}
        className={cn(
          'px-3 py-1.5 outline-none transition-all duration-200 text-sm',
          'bg-[#e8e6e6] text-[#2a2728] placeholder-[#a0a2a3]',
          'rounded-full',
          'shadow-[inset_0_0_3px_#b9b9b9]',
          'hover:bg-[#f0f0f0] hover:shadow-[inset_0_0_0_1px_#fefefe,0_0_4px_rgba(0,0,0,0.3)]',
          'active:bg-[#cfcdcd] active:shadow-[inset_0_0_3px_#b9b9b9]',
          'focus:bg-[#e8e6e6] focus:shadow-[inset_0_0_3px_#b9b9b9]',
          inputClassName
        )}
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
    </div>
  );
};

export default EndfieldInput;
