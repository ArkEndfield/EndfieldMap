import { motion, useAnimate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { type ZmdAlertProps } from '@/components/common/alert/alert';
import { cn } from '@/utils/style';

export const BlurAlert: React.FC<ZmdAlertProps> = ({
  open,
  onOpenChange,
  dismissible = true,
  hideCancel = false,
  cancelText,
  confirmText,
  loading = false,
  width = '24rem',
  height = 'auto',
  children,
  classNames,
  onDismiss = () => {},
  onCancel = () => {},
  onClose = () => {},
  onConfirm = () => {},
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [alertRef, alertAnimate] = useAnimate();

  const { t } = useTranslation();

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

  useEffect(() => {
    const animate = async () => {
      if (open) {
        setBackdropVisible(true);

        await new Promise((resolve) => setTimeout(resolve, 10));

        if (!alertRef.current) return;

        await alertAnimate(
          alertRef.current,
          {
            scale: [0.9, 1],
            opacity: [0, 1],
          },
          { duration: 0.2, type: 'spring', bounce: 0.25 }
        );
      } else if (backdropVisible) {
        if (alertRef.current) {
          await alertAnimate(
            alertRef.current,
            {
              scale: 0.95,
              opacity: 0,
            },
            { duration: 0.15 }
          );
        }

        setBackdropVisible(false);
      }
    };

    animate();
  }, [open, alertAnimate, alertRef, backdropVisible]);

  useEffect(() => {
    if (backdropVisible) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [backdropVisible]);

  if (!backdropVisible && !open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed top-0 left-0 w-screen h-screen inset-0 z-20',
        'flex items-center justify-center',
        'bg-black/40 backdrop-blur-sm',
        'max-w-screen max-h-screen backdrop:bg-transparent',
        classNames?.backdrop && typeof classNames.backdrop === 'function'
          ? classNames.backdrop(open)
          : classNames?.backdrop
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <motion.div
        ref={alertRef}
        className={cn(
          'min-h-40 max-h-[calc(100vh-4rem)] max-w-[calc(100vw-2rem)]',
          'rounded-2xl overflow-hidden',
          'bg-white/90 backdrop-blur-2xl',
          'border border-white/20',
          'shadow-2xl shadow-black/20',
          'flex flex-col p-6',
          'md:max-w-[calc(100vw-1rem)]',
          classNames?.alert && typeof classNames.alert === 'function' ? classNames.alert(open) : classNames?.alert
        )}
        style={{
          width,
          height,
          transform: 'scale(0.9)',
          opacity: 0,
        }}
        initial={false}
      >
        {/* Content */}
        <div
          className={cn(
            'flex-1 flex flex-col min-h-0',
            classNames?.content && typeof classNames.content === 'function'
              ? classNames.content(open)
              : classNames?.content
          )}
        >
          <div className="flex-1 text-gray-800 overflow-auto">{children}</div>
        </div>

        {/* Actions */}
        <div className={cn('flex gap-3 pt-6', hideCancel ? 'justify-center' : 'justify-end')}>
          {!hideCancel && (
            <button
              className={cn(
                'px-6 py-2.5 rounded-xl',
                'bg-white/50 hover:bg-white/70',
                'text-gray-700 font-medium text-sm',
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
              'px-6 py-2.5 rounded-xl',
              'bg-blue-500 hover:bg-blue-600',
              'text-white font-medium text-sm',
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
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
      </motion.div>
    </dialog>,
    document.body
  );
};

export default BlurAlert;
