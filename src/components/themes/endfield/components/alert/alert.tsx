import { motion, useAnimate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { type ZmdAlertProps } from '@/components/common/alert/alert';
import { ZmdButton } from '@/components/common/endfield_components/button';
import { ZmdAlertCloseIcon, ZmdAlertTickIcon } from '@/components/common/endfield_components/icons';
import { cn } from '@/utils/style';

const ALERT_BG = '/images/bg/alert/alert_bg.png';
const ALERT_BANNER_BG_LEFT = '/images/bg/alert/alert_banner_bg_left.png';
const ALERT_BANNER_BG_RIGHT = '/images/bg/alert/alert_banner_bg_right.png';

export const ZmdAlert: React.FC<ZmdAlertProps> = ({
  open,
  onOpenChange,
  dismissible = true,
  hideCancel = false,
  cancelText,
  confirmText,
  loading = false,
  showIcon = true,
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
  const [isOpening, setIsOpening] = useState(false);

  const [alertRef, alertAnimate] = useAnimate();
  const [contentRef, contentAnimate] = useAnimate();
  const [buttonsRef] = useAnimate();

  const { t } = useTranslation();

  const handleDismiss = () => {
    if (isOpening || !dismissible || isProcessing) return;

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
    const shineAnimate = async (scope: typeof contentRef, show: boolean) => {
      if (!scope.current) return;

      if (show) {
        await contentAnimate(scope.current, { opacity: 1 }, { duration: 0.1 });
        await contentAnimate(scope.current, { opacity: 0 }, { duration: 0.005, delay: 0.07 });
        await contentAnimate(scope.current, { opacity: 1 }, { duration: 0.005, delay: 0.005 });
        await contentAnimate(scope.current, { opacity: 0 }, { duration: 0.005, delay: 0.005 });
        await contentAnimate(scope.current, { opacity: 1 }, { duration: 0.005, delay: 0.005 });
      } else {
        await contentAnimate(scope.current, { opacity: 0 }, { duration: 0.15 });
      }
    };

    const animate = async () => {
      if (open) {
        setIsOpening(true);
        setBackdropVisible(true);

        // Wait for DOM to be ready
        await new Promise((resolve) => setTimeout(resolve, 10));

        if (!alertRef.current) return;

        await alertAnimate(
          alertRef.current,
          {
            transform: ['scaleY(0)', 'scaleY(1)'],
            opacity: [0, 1],
          },
          { duration: 0.15 }
        );

        shineAnimate(contentRef, true);
        shineAnimate(buttonsRef, true);
        setIsOpening(false);
      } else if (backdropVisible) {
        // Only animate close if dialog was visible
        shineAnimate(contentRef, false);
        shineAnimate(buttonsRef, false);

        if (alertRef.current) {
          await Promise.all([
            alertAnimate(alertRef.current, { transform: ['scaleY(1)', 'scaleY(0)'] }, { duration: 0.15 }),
            alertAnimate(alertRef.current, { opacity: [1, 0] }, { duration: 0.03, delay: 0.07 }),
          ]);
        }

        setBackdropVisible(false);
      }
    };

    animate();
  }, [open, alertAnimate, alertRef, contentRef, buttonsRef, contentAnimate, backdropVisible]);

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
        'fixed top-0 left-0 w-screen h-screen inset-0 z-20 flex items-center bg-black/20 justify-center max-w-screen max-h-screen backdrop:bg-transparent',
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
          'min-h-[10em] max-h-[calc(100vh-4em)] max-w-[calc(100vw-2em)] bg-[#fefefe] rounded-[0.2em] shadow-[0_0_0.4em_rgba(0,0,0,0.3)] flex flex-col pt-[1.7em] pb-4 px-0 m-4 relative bg-no-repeat bg-size-[90%_auto] bg-position-[bottom_right] md:max-w-[calc(100vw-0.2em)] md:pt-[1.7em] md:m-2',
          classNames?.alert && typeof classNames.alert === 'function' ? classNames.alert(open) : classNames?.alert
        )}
        style={{
          width,
          height,
          backgroundImage: `url(${ALERT_BG})`,
          transformOrigin: open ? 'top' : 'bottom',
          transform: 'scaleY(0)',
          opacity: 0,
        }}
        initial={false}
      >
        {/* Banner */}
        <div className="absolute w-full top-0 left-0 z-0 flex items-stretch h-[4.5em]">
          <span
            className="block h-full flex-1 bg-contain bg-top-left bg-repeat-x pr-[30%]"
            style={{ backgroundImage: `url(${ALERT_BANNER_BG_LEFT})` }}
          />
          <span className="block shrink-0 grow-0 bg-no-repeat h-[4.5em]">
            <img src={ALERT_BANNER_BG_RIGHT} alt="" className="h-full block select-none pointer-events-none" />
          </span>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className={cn(
            'flex-1 flex flex-col min-h-0 mx-4 z-1 relative',
            classNames?.content && typeof classNames.content === 'function'
              ? classNames.content(open)
              : classNames?.content
          )}
        >
          <div className="flex-1 py-4 text-[#2a2728] overflow-auto">{children}</div>
        </div>

        {/* Actions */}
        <div
          ref={buttonsRef}
          className={cn(
            'flex gap-4 px-4 pt-4 z-1 relative',
            hideCancel ? 'justify-center' : 'justify-between',
            !open && 'hidden'
          )}
        >
          {!hideCancel && (
            <ZmdButton
              type="default"
              text={cancelText ?? t('cancel')}
              showIcon={showIcon}
              disabled={isProcessing}
              onClick={handleCancel}
              icon={<ZmdAlertCloseIcon />}
              classNames={{
                button: 'w-1/2',
              }}
            />
          )}
          <ZmdButton
            type="primary"
            text={confirmText ?? t('confirm')}
            showIcon={showIcon}
            loading={isProcessing || loading}
            disabled={isProcessing || loading}
            onClick={handleConfirm}
            icon={<ZmdAlertTickIcon />}
            classNames={{
              button: 'w-1/2',
            }}
          />
        </div>
      </motion.div>
    </dialog>,
    document.body
  );
};

export default ZmdAlert;
