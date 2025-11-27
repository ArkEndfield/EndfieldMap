import { CloseButton } from '@/components/common/close_button';
import { AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
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
}) =>
  createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={
            cn(
                "fixed left-1/2 -translate-x-1/2 top-16 max-w-full md:max-w-3/4",
                "flex items-center gap-1 overflow-hidden rounded-full",
                "bg-black/60 text-white backdrop-blur-md",
                "whitespace-nowrap",
                className
            )
          }
          initial={{
            width: 0,
            opacity: 0,
          }}
          animate={{
            width: 'auto',
            opacity: 1,
          }}
          exit={{
            width: 0,
            opacity: 0,
          }}
        >
          <div className='flex-1 pl-4 py-1 overflow-hidden'>{children}</div>
          <CloseButton onClose={onClose} className='m-1 shrink-0' />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
