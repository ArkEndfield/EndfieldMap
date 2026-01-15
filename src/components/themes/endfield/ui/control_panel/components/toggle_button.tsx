import { useState } from 'react';

import { ZmdSquareIconButton } from '@/components/common/endfield_components/button/square_icon_button';
import { cn } from '@/utils/style';

export interface ToggleButtonProps {
  checked?: boolean;
  value?: boolean;
  onChange?: (value: boolean) => void;
  children: React.ReactElement;
  className?: string;
}

export default function ToggleButton({ checked, value, onChange, children, className }: ToggleButtonProps) {
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
    <ZmdSquareIconButton className={cn(isActive && 'bg-[#fffa00] hover:bg-[#fffa00]', className)} onClick={toggle}>
      {children}
    </ZmdSquareIconButton>
  );
}
