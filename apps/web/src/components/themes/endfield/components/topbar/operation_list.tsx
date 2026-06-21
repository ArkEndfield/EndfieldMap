import { cn } from '@endfieldmap/tools';
import { useWindow } from '@endfieldmap/web-components';
import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

export const OperationList = ({
  children,
  open,
  className,
  position = 'top',
}: {
  children: React.ReactNode;
  open: boolean;
  className?: string;
  position?: 'top' | 'bottom';
}) => {
  const currentWindow = useWindow();

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed left-1/2 -translate-x-1/2 pointer-events-none overflow-x-auto z-2 max-w-[calc(100vw-3rem)] scrollbar-hide',
            position === 'bottom' ? 'bottom-6' : 'top-13'
          )}
          initial={{
            width: 0,
            opacity: 0,
          }}
          animate={{
            width: 'auto',
            opacity: 1,
            transition: { duration: 0.3, ease: 'easeInOut' },
          }}
          exit={{
            width: 0,
            opacity: 0,
          }}
        >
          <div className={cn('flex items-center justify-center gap-1 *:pointer-events-auto', 'min-w-max', className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    currentWindow.document.body
  );
};
