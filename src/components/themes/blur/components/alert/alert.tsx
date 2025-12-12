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
  width = '30em',
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
            scale: [1.05, 1],
            opacity: [0, 1],
          },
          { duration: 0.2, ease: [0.32, 0.72, 0, 1] }
        );
      } else if (backdropVisible) {
        if (alertRef.current) {
          await alertAnimate(
            alertRef.current,
            {
              scale: 1.05,
              opacity: 0,
            },
            { duration: 0.15, ease: [0.32, 0.72, 0, 1] }
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
        'bg-black/30',
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
          'max-h-[calc(100vh-4rem)] max-w-[calc(100vw-2rem)]',
          'rounded-2xl overflow-hidden',
          'bg-black/50 backdrop-blur-[40px]',
          'border border-white/20',
          'shadow-xl shadow-black/20',
          'flex flex-col',
          'md:max-w-[calc(100vw-1rem)]',
          classNames?.alert && typeof classNames.alert === 'function' ? classNames.alert(open) : classNames?.alert
        )}
        style={{
          width,
          height,
          transform: 'scale(1.05)',
          opacity: 0,
        }}
        initial={false}
      >
        {/* Content */}
        <div
          className={cn(
            'flex-1 flex flex-col min-h-0 px-5 pt-5 pb-4',
            classNames?.content && typeof classNames.content === 'function'
              ? classNames.content(open)
              : classNames?.content
          )}
        >
          <div className="flex-1 text-white overflow-auto text-center text-[15px] leading-[22px]">{children}</div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/20" />

        {/* Actions - Apple style buttons */}
        <div className={cn('flex', hideCancel ? 'flex-col' : 'flex-row')}>
          {!hideCancel && (
            <>
              <button
                className={cn(
                  'flex-1 py-3 px-2',
                  'text-base font-normal',
                  'text-white/90',
                  'transition-colors duration-150',
                  'active:bg-white/10',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
                disabled={isProcessing}
                onClick={handleCancel}
              >
                {cancelText ?? t('cancel')}
              </button>
              {/* Vertical divider between buttons */}
              <div className="w-px bg-white/20" />
            </>
          )}
          <button
            className={cn(
              'flex-1 py-3 px-2',
              'text-base font-semibold',
              'text-white',
              'transition-colors duration-150',
              'active:bg-white/10',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            disabled={isProcessing || loading}
            onClick={handleConfirm}
            data-alert-confirm
          >
            {isProcessing || loading ? (
              <span className="flex items-center justify-center gap-2">
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
