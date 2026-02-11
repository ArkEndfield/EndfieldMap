import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';

export interface FlashWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const FlashWrapper = observer(({ id, children, className }: FlashWrapperProps) => {
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (id && uiManager.targetSettingItem === id) {
      setFlashing(true);
      const timer = setTimeout(() => {
        setFlashing(false);
        uiManager.targetSettingItem = null;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [id, uiManager.targetSettingItem]);

  return (
    <div
      id={id}
      data-setting-key={id}
      className={cn(
        'transition-colors duration-300 rounded-sm relative',
        flashing && 'bg-yellow-500/30 border-yellow-500',
        className
      )}
    >
      {children}
      {flashing && (
        <div className="absolute inset-0 z-0 bg-yellow-400/20 animate-pulse pointer-events-none rounded-sm" />
      )}
    </div>
  );
});
