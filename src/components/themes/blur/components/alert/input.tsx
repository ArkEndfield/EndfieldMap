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
    <div className="flex flex-col gap-3 w-full">
      {content && <div className="text-gray-700">{content}</div>}
      <input
        type={inputType}
        className={cn(
          'px-4 py-2.5 outline-none transition-all duration-200 text-sm w-full',
          'bg-white/50 text-gray-800 placeholder-gray-400',
          'rounded-xl',
          'border border-gray-200',
          'focus:border-blue-400 focus:bg-white',
          'focus:ring-2 focus:ring-blue-400/20',
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
