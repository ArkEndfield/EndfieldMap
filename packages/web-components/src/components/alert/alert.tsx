import type { ZmdAlertProps } from '@endfieldmap/map-web-theme-types';
import { cn } from '@endfieldmap/tools';
import ALERT_BANNER_BG_LEFT from '@endfieldmap/web-components/assets/alert/alert_banner_bg_left.png';
import ALERT_BANNER_BG_RIGHT from '@endfieldmap/web-components/assets/alert/alert_banner_bg_right.png';
import ALERT_BG from '@endfieldmap/web-components/assets/alert/alert_bg.png';
import { ZmdRoundButton } from '@endfieldmap/web-components/components/button/round_button';
import { ZmdAlertCloseIcon, ZmdAlertTickIcon } from '@endfieldmap/web-components/components/icons/alert';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';

const GLITCH_OPACITY = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1];
const GLITCH_TIMES = [0, 0.48, 0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1];
const GLITCH_DURATION = 0.205;

const AlertInner: React.FC<ZmdAlertProps> = ({
  open,
  hideCancel,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  loading,
  showIcon,
  width = '30em',
  height,
  children,
  classNames,
  onDismiss,
  onCancel,
  onConfirm,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
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
          onDismiss?.();
        }
      }}
    >
      <motion.div
        className={cn(
          'min-h-[10em] max-h-[calc(100vh-4em)] max-w-[calc(100vw-2em)] bg-[#fefefe] rounded-[0.2em] shadow-[0_0_0.4em_rgba(0,0,0,0.3)] flex flex-col pt-[1.7em] pb-4 px-0 m-4 relative bg-no-repeat bg-size-[90%_auto] bg-position-[bottom_right] md:max-w-[calc(100vw-0.2em)] md:pt-[1.7em] md:m-2',
          classNames?.alert && typeof classNames.alert === 'function' ? classNames.alert(open) : classNames?.alert
        )}
        style={{
          width,
          height,
          backgroundImage: `url(${ALERT_BG})`,
          transformOrigin: 'top',
        }}
        initial={{ transform: 'scaleY(0)', opacity: 0 }}
        animate={{ transform: 'scaleY(1)', opacity: 1, transition: { duration: 0.15 } }}
        exit={{
          transform: 'scaleY(0)',
          opacity: 0,
          transition: {
            transform: { duration: 0.15 },
            opacity: { duration: 0.03, delay: 0.07 },
          },
        }}
      >
        <div className="absolute w-full top-0 left-0 z-0 flex items-stretch h-[4.5em]">
          <span
            className="block h-full flex-1 bg-contain bg-top-left bg-repeat-x pr-[30%]"
            style={{ backgroundImage: `url(${ALERT_BANNER_BG_LEFT})` }}
          />
          <span className="block shrink-0 grow-0 bg-no-repeat h-[4.5em]">
            <img src={ALERT_BANNER_BG_RIGHT} alt="" className="h-full block select-none pointer-events-none" />
          </span>
        </div>

        <motion.div
          className={cn(
            'flex-1 flex flex-col min-h-0 mx-4 z-1 relative',
            classNames?.content && typeof classNames.content === 'function'
              ? classNames.content(open)
              : classNames?.content
          )}
          initial={{ opacity: 0 }}
          animate={{
            opacity: GLITCH_OPACITY,
            transition: { duration: GLITCH_DURATION, times: GLITCH_TIMES },
          }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <div className="flex-1 py-4 text-[#2a2728]">{children}</div>
        </motion.div>

        <motion.div
          className={cn('flex gap-4 px-4 pt-4 z-1 relative', hideCancel ? 'justify-center' : 'justify-between')}
          initial={{ opacity: 0 }}
          animate={{
            opacity: GLITCH_OPACITY,
            transition: { duration: GLITCH_DURATION, times: GLITCH_TIMES },
          }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          {!hideCancel && (
            <ZmdRoundButton
              type="default"
              text={cancelText}
              showIcon={showIcon}
              disabled={loading}
              onClick={() => onCancel?.()}
              icon={<ZmdAlertCloseIcon />}
              classNames={{
                button: 'w-1/2',
              }}
            />
          )}
          <ZmdRoundButton
            type="primary"
            text={confirmText}
            showIcon={showIcon}
            loading={loading}
            disabled={loading}
            onClick={() => onConfirm?.()}
            icon={<ZmdAlertTickIcon />}
            classNames={{
              button: 'w-1/2',
            }}
          />
        </motion.div>
      </motion.div>
    </dialog>
  );
};

export const ZmdAlert: React.FC<ZmdAlertProps> = (props) => {
  return <AnimatePresence>{props.open && <AlertInner {...props} />}</AnimatePresence>;
};
