import type { ZmdAlertFullProps } from '@endfieldmap/map-web-theme-types/alert';
import { cn } from '@endfieldmap/tools';
import ALERT_BANNER_BG_LEFT from '@endfieldmap/web-components/assets/alert/alert_banner_bg_left.png';
import ALERT_BANNER_BG_RIGHT from '@endfieldmap/web-components/assets/alert/alert_banner_bg_right.png';
import DECO_COMMON_LOGO_BG from '@endfieldmap/web-components/assets/deco_common_logo_bg.png';
import { ZmdRoundButton } from '@endfieldmap/web-components/components/button/round_button';
import { ZmdAlertCloseIcon, ZmdAlertTickIcon } from '@endfieldmap/web-components/components/icons/alert';
import { ScrollArea } from '@endfieldmap/web-components/components/scroll_area';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';

export const ZmdAlertFull = ({
  open,
  hideCancel = false,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  loading = false,
  showIcon = true,
  height = 'auto',
  children,
  onDismiss,
  onCancel,
  onConfirm,
}: ZmdAlertFullProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.dialog
          className="fixed top-0 right-0 bottom-0 left-0 w-screen h-screen z-60 flex items-center justify-center backdrop:bg-transparent"
          initial={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
          animate={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          exit={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
          transition={{ duration: 0.05 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onDismiss?.();
            }
          }}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                className="w-full min-h-[10em] max-h-[calc(100vh-4em)] bg-[#fefefe] flex flex-col pt-[1.7em] pb-4 relative"
                style={{
                  height,
                  filter: 'drop-shadow(0 0 0.4em rgba(0, 0, 0, 0.3))',
                  transformOrigin: 'center right',
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1], opacity: [0, 1] }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <div
                  className="absolute left-[-2em] bottom-0 w-full h-[calc(100%-1em)] bg-contain bg-bottom-left bg-no-repeat -z-1 pointer-events-none"
                  style={{ backgroundImage: `url(${DECO_COMMON_LOGO_BG})` }}
                />

                <div className="absolute top-0 left-0 w-[15em] max-w-full h-[0.2em] -z-1 grid grid-cols-4">
                  <span className="bg-[#f0f48a] col-span-2" />
                  <span className="bg-[#57a2b5]" />
                  <span className="bg-[#b96bbc]" />
                </div>

                <div className="absolute w-[40em] top-0 right-0 z-0 flex items-stretch h-[3em] scale-x-[-1]">
                  <span
                    className="block h-full flex-1 bg-contain bg-top-left bg-repeat-x pr-[30%]"
                    style={{ backgroundImage: `url(${ALERT_BANNER_BG_LEFT})` }}
                  />
                  <span className="block shrink-0 grow-0 bg-no-repeat h-[3em]">
                    <img
                      src={ALERT_BANNER_BG_RIGHT}
                      alt=""
                      className="h-full block select-none pointer-events-none"
                      draggable={false}
                    />
                  </span>
                </div>

                <div className="flex-1 flex flex-col min-h-0 mx-4 z-1 relative">
                  <ScrollArea scrollX={false} className="flex-1">
                    <div className="flex-1 py-4 text-[#2a2728] flex flex-col items-center">{children}</div>
                  </ScrollArea>
                </div>

                {open && (
                  <div
                    className={cn(
                      'mx-auto w-[26em] max-w-[calc(100%-2em)] mb-[-2em] flex gap-8 px-4 pt-4 z-1 relative',
                      'md:w-[25em] md:gap-4',
                      hideCancel && 'justify-center'
                    )}
                  >
                    {!hideCancel && (
                      <div className="relative flex-1 flex">
                        <div className="absolute top-1/2 left-[-0.24em] right-[-0.24em] bottom-[-0.24em] rounded-b-full bg-[#fefefe] -z-1" />
                        <ZmdRoundButton
                          className="flex-1"
                          type="default"
                          text={cancelText}
                          showIcon={showIcon}
                          disabled={loading}
                          onClick={() => onCancel?.()}
                          icon={<ZmdAlertCloseIcon />}
                        />
                      </div>
                    )}
                    <div className="relative flex-1 flex">
                      <div className="absolute top-1/2 left-[-0.24em] right-[-0.24em] bottom-[-0.24em] rounded-b-full bg-[#fefefe] -z-1" />
                      <ZmdRoundButton
                        className="flex-1"
                        type="primary"
                        text={confirmText}
                        showIcon={showIcon}
                        loading={loading}
                        disabled={loading}
                        onClick={() => onConfirm?.()}
                        icon={<ZmdAlertTickIcon />}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.dialog>
      )}
    </AnimatePresence>
  );
};
