import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { CloseButton } from '@/components/common/close_button';
import { useWindow } from '@/context/window';
import { cn } from '@/utils/style';

export const OperationTip = ({
  children,
  open,
  onClose,
  className,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  className?: string;
}) => {
  const currentWindow = useWindow();

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed left-1/2 -translate-x-1/2 top-16 max-w-full md:max-w-3/4 z-11',
            'flex items-center gap-1 overflow-hidden rounded-full',
            'bg-black/60 text-white backdrop-blur-md',
            'whitespace-nowrap',
            className
          )}
          initial={{
            clipPath: 'inset(0 50% 0 50% round 9999px)',
            opacity: 0,
          }}
          animate={{
            clipPath: 'inset(0 0% 0 0% round 9999px)',
            opacity: 1,
          }}
          exit={{
            clipPath: 'inset(0 50% 0 50% round 9999px)',
            opacity: 0,
          }}
        >
          <div className="flex-1 pl-4 py-1 overflow-hidden">{children}</div>
          <CloseButton onClose={onClose} className="m-1 shrink-0" />
        </motion.div>
      )}
    </AnimatePresence>,
    currentWindow.document.body
  );
};
