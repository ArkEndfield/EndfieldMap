import { type ZmdAlertFullProps } from '@themes/types/alert';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { ScrollArea } from '@/components/common/scroll_area';
import { cn } from '@/utils/style';

export const BlurAlertFull = ({
  open,
  onOpenChange,
  dismissible = true,
  hideCancel = false,
  cancelText,
  confirmText,
  loading = false,
  height = 'auto',
  children,
  onDismiss = () => {},
  onCancel = () => {},
  onClose = () => {},
  onConfirm = () => {},
}: ZmdAlertFullProps) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleCancel = () => {
    if (isProcessing) return;

    const result = onCancel();
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

  const handleConfirm = () => {
    if (isProcessing) return;

    const result = onConfirm();
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

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.dialog
          className="fixed top-0 right-0 bottom-0 left-0 w-screen h-screen z-60 flex items-center justify-center backdrop:bg-transparent"
          initial={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
          animate={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          exit={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDismiss();
            }
          }}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                className={cn(
                  'w-full min-h-40 max-h-[calc(100vh-4rem)]',
                  'bg-white/90 backdrop-blur-2xl',
                  'border-y border-white/20',
                  'shadow-2xl shadow-black/20',
                  'flex flex-col py-6'
                )}
                style={{
                  height,
                }}
                initial={{ scaleY: 0.9, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0.9, opacity: 0 }}
                transition={{ duration: 0.2, type: 'spring', bounce: 0.25 }}
              >
                {/* Content wrapper */}
                <div className="flex-1 flex flex-col min-h-0 mx-6 z-1 relative">
                  <ScrollArea scrollX={false} className="flex-1">
                    <div className="flex-1 py-4 text-gray-800 flex flex-col items-center">{children}</div>
                  </ScrollArea>
                </div>

                {/* Actions */}
                {open && (
                  <div
                    className={cn(
                      'mx-auto w-104 max-w-[calc(100%-2rem)] flex gap-4 px-4 pt-6 z-1 relative',
                      'md:w-100',
                      hideCancel && 'justify-center'
                    )}
                  >
                    {!hideCancel && (
                      <button
                        className={cn(
                          'flex-1 px-6 py-3 rounded-xl',
                          'bg-white/50 hover:bg-white/70',
                          'text-gray-700 font-medium',
                          'transition-all duration-200',
                          'active:scale-95',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        disabled={isProcessing}
                        onClick={handleCancel}
                      >
                        {cancelText ?? t('cancel')}
                      </button>
                    )}
                    <button
                      className={cn(
                        'flex-1 px-6 py-3 rounded-xl',
                        'bg-blue-500 hover:bg-blue-600',
                        'text-white font-medium',
                        'transition-all duration-200',
                        'active:scale-95',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'shadow-lg shadow-blue-500/30'
                      )}
                      disabled={isProcessing || loading}
                      onClick={handleConfirm}
                      data-alert-confirm
                    >
                      {isProcessing || loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          {confirmText ?? t('confirm')}
                        </span>
                      ) : (
                        (confirmText ?? t('confirm'))
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.dialog>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BlurAlertFull;
