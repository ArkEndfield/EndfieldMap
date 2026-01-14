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
          className={cn(
            'fixed left-1/2 -translate-x-1/2 top-13 w-full md:w-[90%] pointer-events-none',
            'flex items-center justify-center gap-1 overflow-hidden *:pointer-events-auto',
            className
          )}
          initial={{
            clipPath: 'inset(0 50% 0 50% round 0px)',
            opacity: 0,
          }}
          animate={{
            clipPath: 'inset(0 0% 0 0% round 0px)',
            opacity: 1,
          }}
          exit={{
            clipPath: 'inset(0 50% 0 50% round 0px)',
            opacity: 0,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
