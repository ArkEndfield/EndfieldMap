import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';
import { useEffect, useState } from 'react';

import { CloseButton } from '@/components/common/close_button';
import { PortalContext } from '@/components/common/portal_context';
import shortcutService from '@/services/shortcut';
import { cn } from '@/utils/style';

export interface UserModalProps {
  /** 控制弹窗显示隐藏 */
  open: boolean;
  /** 弹窗关闭的回调，返回 false 或 Promise<false> 阻止关闭 */
  onClose?: () => boolean | void | Promise<boolean | void>;
  /** 状态改变回调 */
  onOpenChange?: (open: boolean) => void;
  /** Modal容器的类名 */
  className?: string;
  /** 背景遮罩的类名 */
  backdropClassName?: string;
  /** 是否允许键盘 ESC 关闭，默认 true */
  keyboardCloseable?: boolean;
  children?: React.ReactNode;
}

const TopDeco = ({ className, reverse }: { className?: string; reverse?: boolean }) => (
  <motion.div
    className={cn(
      'w-full h-8 top-0 shrink-0 grow-0 origin-left',
      'bg-[linear-gradient(45deg,#8a7a20_0,#8a7a20_12.5%,#b0a030_12.5%,#b0a030_37.5%,#8a7a20_37.5%,#8a7a20_62.5%,#b0a030_62.5%,#b0a030_87.5%,#8a7a20_87.5%,#8a7a20_100%)]',
      'bg-repeat bg-size-[0.3em_0.3em]',
      reverse
        ? 'mask-[linear-gradient(to_left,black_40%,transparent)]'
        : 'mask-[linear-gradient(to_right,black_40%,transparent)]',
      className
    )}
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1, transition: { duration: 0.12, ease: 'easeOut' } }}
    exit={{ scaleX: 0, transition: { duration: 0.1, ease: 'easeIn', delay: 0.15 } }}
  />
);
const BottomDeco = () => {
  return (
    <motion.div
      className="relative h-1 flex items-stretch mx-12 shrink-0 grow-0 origin-center"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1, transition: { duration: 0.15, ease: 'easeOut', delay: 0.1 } }}
      exit={{ scaleX: 0, transition: { duration: 0.08, ease: 'easeIn' } }}
    >
      <div className="w-32 h-full bg-[#ff1aac]"></div>
      <div className="flex-1 h-full bg-[#fffa00]"></div>
      <div className="w-32 h-full bg-[#01ffa2]"></div>
    </motion.div>
  );
};

const BottomTextDeco = () => {
  return (
    <motion.div
      className="absolute bottom-2 left-0 right-0 flex flex-col items-center justify-center shrink-0 w-full gap-0.5 opacity-80"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 0.8, scale: 1, transition: { duration: 0.2, delay: 0.15 } }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
    >
      <svg viewBox="0 0 52 6" className="h-2 w-auto">
        <text x="0" y="6" fontSize="6" fontStyle="italic" fill="#ffffff" fontFamily="Outfit">
          //
        </text>
        <text x="10" y="6" fontSize="6" fill="#ffffff" fontFamily="Outfit">
          ENDFIELDMAP
        </text>
      </svg>
      <div className="w-1/2 h-0.5 bg-[linear-gradient(90deg,transparent,#fff,transparent)]" />
    </motion.div>
  );
};

const UserModalInner: React.FC<UserModalProps> = ({
  open,
  onClose,
  onOpenChange,
  className,
  backdropClassName,
  keyboardCloseable = true,
  children,
}) => {
  const [dialogElement, setDialogElement] = useState<HTMLDialogElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      dialogElement?.showModal();
    } else {
      dialogElement?.close();
    }
  }, [open, dialogElement]);

  const handleClose = () => {
    if (isProcessing) return;

    if (!onClose) {
      onOpenChange?.(false);
      return;
    }

    const result = onClose();
    if (result instanceof Promise) {
      setIsProcessing(true);
      result
        .then((res) => {
          setIsProcessing(false);
          if (res !== false) {
            onOpenChange?.(false);
          }
        })
        .catch(() => {
          setIsProcessing(false);
        });
    } else if (result !== false) {
      onOpenChange?.(false);
    }
  };

  useEffect(() => {
    if (!open || !keyboardCloseable) return;
    const dispose = shortcutService.register('Escape', () => {
      handleClose();
      return true;
    });
    return () => dispose();
  }, [open, keyboardCloseable, handleClose]);

  return (
    <dialog
      ref={setDialogElement}
      className={cn(
        'backdrop:bg-transparent fixed inset-0 z-50 flex items-center justify-center p-0 m-0 w-screen h-screen max-w-none max-h-screen bg-black/20',
        'backdrop-blur-xs',
        backdropClassName
      )}
    >
      <PortalContext.Provider value={dialogElement}>
        <motion.div
          className={cn(
            'bg-[#111] relative overflow-hidden flex flex-col text-white w-2xl max-w-full max-h-full',
            'bg-[repeating-linear-gradient(-45deg,#23232318_0,#23232318_1px,transparent_0,transparent_2px)]',
            className
          )}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.15 } }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, delay: 0.2 } }}
        >
          <div className="absolute inset-0 z-0 h-full w-full bg-[url('/images/bg/monthlypass_newbg02.png')] bg-size-[100%_auto] bg-bottom bg-no-repeat opacity-34" />
          <TopDeco />
          <motion.div
            className="absolute top-1 right-2 z-20"
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { duration: 0.2, ease: 'backOut', delay: 0.2 } }}
            exit={{ scale: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
          >
            <CloseButton onClose={handleClose} className="w-6 h-6" />
          </motion.div>
          <div className="flex-1 relative z-1 overflow-hidden">{children}</div>
          <BottomTextDeco />
          <BottomDeco />
        </motion.div>
      </PortalContext.Provider>
    </dialog>
  );
};

export const UserModal: React.FC<UserModalProps> = (props) => {
  return <AnimatePresence>{props.open && <UserModalInner {...props} />}</AnimatePresence>;
};
