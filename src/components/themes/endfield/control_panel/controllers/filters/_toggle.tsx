import { cn } from '@/utils/style';
import { useState } from 'react';

interface ToggleProps {
  checked?: boolean;
  value?: boolean;
  onChange?: (value: boolean) => void;
  children?: React.ReactNode;
  className?: string;
}

export default function FilterToggle({ checked, value, onChange, children, className }: ToggleProps) {
  const [internalActive, setInternalActive] = useState(false);

  const isActive =
    checked !== undefined ? checked : value !== undefined ? value : internalActive;

  const toggle = () => {
    const newValue = !isActive;

    if (checked !== undefined) {
      onChange?.(newValue);
      return;
    }

    if (value !== undefined) {
      onChange?.(newValue);
    } else {
      setInternalActive(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <div
      className={cn(
        'relative inline-block px-3 py-[0.4em] text-left cursor-pointer select-none',
        'whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out',
        '[clip-path:polygon(0%_0%,100%_0%,100%_calc(100%-10px),calc(100%-10px)_100%,0%_100%)]',
        'before:content-[\'\'] before:absolute before:top-0 before:left-0', 
        'before:w-full before:h-full before:bg-[#fdfb55] before:-z-10',
        'before:transition-transform before:duration-[0.4s] before:ease-in-out',
        isActive
            ? 'text-[#222205] before:scale-x-100 before:origin-left'
            : 'bg-[#3a3a38] text-[#ededed] before:scale-x-0 before:origin-right',
        className,
      )}
      onClick={toggle}
    >
      {children}
    </div>
  );
}
