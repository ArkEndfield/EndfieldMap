import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, shortcutService } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { contextMenuManager } from '@/services/context_menu_manager';

const MENU_PADDING = 8;

const ContextMenu: React.FC = observer(() => {
  const { t } = useTranslation('common');
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { isOpen, context } = contextMenuManager;

  const items = context ? contextMenuManager.getVisibleItems(context) : [];

  useEffect(() => {
    if (!isOpen || !context) return;

    const { pixel } = context;
    let x = pixel[0];
    let y = pixel[1];

    requestAnimationFrame(() => {
      const menu = menuRef.current;
      if (!menu) return;
      const rect = menu.getBoundingClientRect();
      if (x + rect.width > window.innerWidth - MENU_PADDING) {
        x = window.innerWidth - rect.width - MENU_PADDING;
      }
      if (y + rect.height > window.innerHeight - MENU_PADDING) {
        y = window.innerHeight - rect.height - MENU_PADDING;
      }
      setPosition({ x: Math.max(MENU_PADDING, x), y: Math.max(MENU_PADDING, y) });
    });

    setPosition({ x, y });
  }, [isOpen, context]);

  const handleClose = useCallback(() => {
    contextMenuManager.close();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const dispose = shortcutService.register('Escape', (e: KeyboardEvent) => {
      e.preventDefault();
      handleClose();
      return true;
    });
    return () => dispose();
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleScroll = () => handleClose();

    window.addEventListener('mousedown', handleClickOutside, true);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, handleClose]);

  if (items.length === 0 && isOpen) {
    contextMenuManager.close();
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && context && items.length > 0 && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.25 }}
          style={{ left: position.x, top: position.y }}
          className={cn(
            'fixed z-[9999] min-w-44 py-1',
            'bg-[#1e1e1e]/95 backdrop-blur-sm',
            'border border-[#4a4a2a] shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
          )}
        >
          {items.map((item) => (
            <ButtonWithAudio
              key={item.id}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90',
                'hover:bg-[#fcee21]/10 hover:text-[#fcee21] transition-colors'
              )}
              onClick={() => {
                item.action(context);
                handleClose();
              }}
            >
              {item.icon && <item.icon />}
              <span>{t(item.label)}</span>
            </ButtonWithAudio>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

export default ContextMenu;
