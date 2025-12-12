import type { PromptInputProps } from '@themes/types/alert';
import { useState } from 'react';

import { cn } from '@/utils/style';

export const PromptInput = ({
  placeholder,
  defaultValue = '',
  inputType = 'text',
  maxLength,
  minLength,
  pattern,
  inputClassName,
  onValueChange,
  content,
}: PromptInputProps) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-3">
      {content && <div>{content}</div>}
      <input
        type={inputType}
        className={cn(
          'px-4 mx-1 py-2 outline-none transition-all duration-200 text-sm',
          'bg-[#f2f1ef] text-[#2a2728] placeholder-[#a0a2a3]',
          'rounded-full',
          'shadow-[0_0_0_0.1em_#f2f1ef,0_0_0_0.1em_#a0a2a3_inset]',
          'focus:shadow-[0_0_0_1px_#FDFB73AA,0_0_8px_#FDFB73AA,0_0_0_0.1em_#a0a2a3_inset]',
          'focus:bg-[#fefcfc]',
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

export default PromptInput;
