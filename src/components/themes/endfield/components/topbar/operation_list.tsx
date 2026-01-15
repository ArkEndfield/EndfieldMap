import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/style';

export const OperationList = ({
  children,
  open,
  className,
}: {
  children: React.ReactNode;
  open: boolean;
  className?: string;
}) =>
  createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn('fixed left-1/2 -translate-x-1/2 top-13 pointer-events-none overflow-hidden z-2')}
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
    document.body
  );
