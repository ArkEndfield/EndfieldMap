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
    <div className="flex flex-col gap-2 w-full">
      {content && (
        <div className="text-gray-600 dark:text-gray-300 text-[13px] leading-[18px] text-center">{content}</div>
      )}
      <input
        type={inputType}
        className={cn(
          'px-3 py-[7px] outline-none transition-all duration-200 text-[13px] w-full',
          'bg-white/80 dark:bg-gray-900/50',
          'text-gray-900 dark:text-gray-100',
          'placeholder-gray-400 dark:placeholder-gray-500',
          'rounded-lg',
          'border border-gray-300/80 dark:border-gray-600/80',
          'focus:border-blue-500 dark:focus:border-blue-400',
          'focus:ring-[3px] focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
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
