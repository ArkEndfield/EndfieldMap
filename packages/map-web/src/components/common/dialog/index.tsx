import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { EndfieldCloseIcon } from '@/components/common/icons';
import { type DialogProps } from '@/components/themes/types/dialog';
import { cn } from '@/utils/style';

import { ScrollArea } from '../scroll_area';

const CloseButton: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  return (
    <motion.div
      className="absolute top-0 right-0 z-20"
      initial={{ scale: 0 }}
      animate={{ scale: 1, transition: { duration: 0.2, ease: 'backOut', delay: 0.2 } }}
      exit={{ scale: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
    >
      <ButtonWithAudio
        className={cn(
          'bg-[#ffff21] text-[#363636] h-9 w-9 font-bold grid place-content-center text-[1.5rem] cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <EndfieldCloseIcon />
      </ButtonWithAudio>
    </motion.div>
  );
};

const TopDecoText: React.FC = () => (
  <svg viewBox="0 0 120 10" className="h-2.5 w-auto">
    {/* ▼ 三角形 */}
    <polygon points="0,2 7,2 3.5,8" fill="#363636" />
    {/* // 斜线 */}
    <text x="7" y="7" fontSize="7" fontStyle="italic" fill="#363636" fontWeight="bold" fontFamily="Outfit">
      //
    </text>
    {/* ARKNIGHTS:ENDFIELD 文字 */}
    <text x="16" y="7" fontSize="7" fill="#363636" fontWeight="bold" fontFamily="Outfit">
      ARKNIGHTS:ENDFIELD
    </text>
  </svg>
);

const TopDecoPlusIcon: React.FC = () => (
  <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 shrink-0">
    <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="#363636" strokeWidth="1" />
    <line x1="5" y1="2.5" x2="5" y2="7.5" stroke="#363636" strokeWidth="1" />
    <line x1="2.5" y1="5" x2="7.5" y2="5" stroke="#363636" strokeWidth="1" />
  </svg>
);

const TitleDeco: React.FC = () => (
  <div className="text-[9rem] absolute font-[Outfit] right-0 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.05)] font-bold tracking-[-0.875rem]">
    ENDFIELD
  </div>
);

const DialogInner: React.FC<DialogProps> = ({
  title,
  icon,
  open,
  width,
  height,
  children,
  classNames,
  onClose,
  onDismiss,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'backdrop:bg-transparent fixed top-0 left-0 w-screen h-screen inset-0 z-20 bg-black/20 max-w-screen max-h-screen flex items-center justify-center',
        classNames?.backdrop && typeof classNames.backdrop === 'function'
          ? classNames.backdrop(open)
          : classNames?.backdrop
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onDismiss?.();
        }
      }}
    >
      <motion.div
        className={cn(
          'flex flex-col max-w-full max-h-full w-3xl',
          classNames?.header && typeof classNames.header === 'function' ? classNames.header(open) : classNames?.header
        )}
        style={{ width, height }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 0.15 } }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, delay: 0.2 } }}
      >
        <header className="select-none shrink-0 relative">
          <motion.div
            className="w-87 h-3.75 flex items-stretch origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1, transition: { duration: 0.12, ease: 'easeOut' } }}
            exit={{ scaleX: 0, transition: { duration: 0.1, ease: 'easeIn', delay: 0.15 } }}
          >
            <div className="w-12.75 bg-[#ffff21]" />
            <div className="flex-1 bg-[#999] px-1 flex justify-between items-center">
              <TopDecoText />
              <TopDecoPlusIcon />
            </div>
          </motion.div>
          <main className="h-15.75 bg-[#363636] flex relative gap-6 overflow-hidden">
            <div className="bg-[#484848] text-[#D3D3D3] flex justify-center items-center w-19.75 shrink-0 text-2xl">
              <motion.div
                className="flex justify-center items-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1, transition: { duration: 0.2, ease: 'backOut', delay: 0.1 } }}
                exit={{ scale: 0, transition: { duration: 0.1, ease: 'easeIn' } }}
              >
                {icon}
              </motion.div>
            </div>
            <div className="flex items-center text-[2rem] font-bold text-white leading-none overflow-hidden flex-1 truncate">
              {title}
            </div>
            <TitleDeco />
          </main>
          <CloseButton
            onClick={onClose}
            className={cn(
              classNames?.close && typeof classNames.close === 'function' ? classNames.close(open) : classNames?.close
            )}
          />
          <motion.div
            className={cn(
              'relative z-10 h-1.5 origin-left',
              'after:border-t-12 after:border-x-12 after:box-content after:border-t-[#ffff1b] after:border-x-transparent after:absolute after:-bottom-2 after:left-13 after:block',
              'bg-[linear-gradient(90deg,#ffff1b,#ffff1b_50%,#d3d3d3_50%)]',
              'filter-[drop-shadow(0_0_0.1875rem_rgba(0,0,0,0.5))]'
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1, transition: { duration: 0.12, ease: 'easeOut', delay: 0.2 } }}
            exit={{ scaleX: 0, transition: { duration: 0.1, ease: 'easeIn', delay: 0.1 } }}
          />
        </header>
        <div
          className={cn(
            'bg-white relative overflow-hidden flex-1',
            'bg-[repeating-linear-gradient(-45deg,transparent,transparent_2px,#ccc2_2px,#ccc2_3px)]',
            classNames?.contentContainer && typeof classNames.contentContainer === 'function'
              ? classNames.contentContainer(open)
              : classNames?.contentContainer
          )}
        >
          <ScrollArea
            className={cn(
              classNames?.content && typeof classNames.content === 'function'
                ? classNames.content(open)
                : classNames?.content
            )}
            contentClassName={cn(
              classNames?.scrollContent && typeof classNames.scrollContent === 'function'
                ? classNames.scrollContent(open)
                : classNames?.scrollContent
            )}
          >
            {children}
          </ScrollArea>
          <motion.div
            className="absolute bottom-0 right-[1.275rem] h-1 w-60 origin-right bg-[linear-gradient(90deg,#00ffa2,#00ffa2_42.5%,#ffff21_42.5%,#ffff21_79.2%,#ff00f0_79.2%)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1, transition: { duration: 0.15, ease: 'easeOut', delay: 0.1 } }}
            exit={{ scaleX: 0, transition: { duration: 0.08, ease: 'easeIn' } }}
          />
        </div>
        <motion.footer
          className={cn(
            'h-3.75 bg-[#ababab] mr-9 px-4 flex justify-start items-center origin-left shrink-0',
            classNames?.footer && typeof classNames.footer === 'function' ? classNames.footer(open) : classNames?.footer
          )}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1, transition: { duration: 0.12, ease: 'easeOut', delay: 0.05 } }}
          exit={{ scaleX: 0, transition: { duration: 0.1, ease: 'easeIn', delay: 0.05 } }}
        >
          <div className="h-2 w-2 bg-[#838383]" />
          <div
            className={cn(
              'h-2 w-2 border border-[#838383] ml-0.5 py-px',
              'mask-[linear-gradient(#fff,#fff_calc(0.25rem*0.5),transparent_calc(0.25rem*0.5),transparent_calc(0.25rem*1.5),#fff_calc(0.25rem*1.5))]'
            )}
          />
          <div
            className={cn(
              'h-2 w-12 ml-1',
              'bg-[repeating-linear-gradient(-45deg,transparent,transparent_1px,#838383_1px,#838383_2px)]'
            )}
          />
        </motion.footer>
      </motion.div>
    </dialog>
  );
};

export const Dialog: React.FC<DialogProps> = (props) => {
  const { open, onOpenChange, dismissible = true, onDismiss = () => {}, onClose = () => {} } = props;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    if (isProcessing) return;

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

  const handleDismiss = () => {
    if (!dismissible || isProcessing) return;

    const result = onDismiss();
    if (result instanceof Promise) {
      setIsProcessing(true);
      result
        .then((res) => {
          setIsProcessing(false);
          if (res !== false) {
            handleClose();
          }
        })
        .catch(() => {
          setIsProcessing(false);
        });
    } else if (result !== false) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {open && <DialogInner {...props} onClose={handleClose} onDismiss={handleDismiss} />}
    </AnimatePresence>
  );
};
