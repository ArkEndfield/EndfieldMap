import { useState } from 'react';

import { cn } from '@/utils/style';

interface ToggleProps {
  checked?: boolean;
  value?: boolean;
  onChange?: (value: boolean) => void;
  children?: React.ReactNode;
  className?: string;
}

export default function FilterToggle({ checked, value, onChange, children, className }: ToggleProps) {
  const [internalActive, setInternalActive] = useState(false);

  const isActive = checked !== undefined ? checked : value !== undefined ? value : internalActive;

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
    <button
      className={cn(
        'relative px-2.5 py-1.5 text-xs font-medium rounded-lg',
        'transition-all duration-200',
        'border border-white/10',
        isActive
          ? 'bg-white/20 text-white shadow-sm'
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white active:scale-95',
        className
      )}
      onClick={toggle}
    >
      {children}
    </button>
  );
}
