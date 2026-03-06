import { SoundType } from '@endfieldmap/map-web-theme-types';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, CloseButton, shortcutService } from '@endfieldmap/web-components';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef } from 'react';

export interface AnnouncementsTabProps<T extends React.Key> {
  icon: React.ReactNode;
  title: string;
  hasUnread?: boolean;
  key: T;
}

export interface AnnouncementsDialogProps<T extends React.Key> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabs: readonly AnnouncementsTabProps<T>[];
  activeTab?: T;
  onTabChange: (key: T) => void;
  children?: React.ReactNode;
}

const AnnouncementsDialogInner = <T extends React.Key>({
  onOpenChange,
  children,
  tabs,
  activeTab,
  onTabChange,
}: AnnouncementsDialogProps<T>) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'backdrop:bg-transparent fixed top-0 left-0 w-screen h-screen inset-0 z-20 bg-black/20 max-w-screen max-h-screen flex items-center justify-center'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <motion.div
        className="w-4xl h-120 max-h-full bg-white relative flex flex-col origin-center rounded-sm overflow-hidden"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } }}
        exit={{ scaleY: 0, opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } }}
      >
        <div className="absolute top-2 right-2 z-1">
          <CloseButton
            className="text-[#444444] hover:text-[#6E6E6E] w-6 h-6 drop-shadow-md"
            onClose={() => onOpenChange(false)}
          />
        </div>
        <div
          className={cn(
            'flex items-end justify-center h-20 shrink-0 gap-2',
            'bg-[url(/images/bg/announcement_header.png)] bg-size-[auto_100%] bg-right bg-no-repeat'
          )}
        >
          {tabs.map((tab) => (
            <ButtonWithAudio
              soundType={SoundType.TICK}
              key={tab.key}
              className={cn(
                'w-45 h-11.5 relative text-lg px-5 font-medium bg-bottom bg-no-repeat bg-[url(/images/bg/bulletin-type-inactive.png)] bg-cover',
                activeTab === tab.key ? 'text-white' : 'text-[#9f9f9f] hover:opacity-80'
              )}
              onClick={() => onTabChange(tab.key)}
            >
              <div
                className="absolute right-0.5 -top-0.5 rotate-45 bg-[#EE7E31] w-2 h-2 z-1 shadow-[0_0_4px_rgba(0,0,0,0.8)]"
                hidden={!tab.hasUnread}
              >
                <div className="absolute -inset-px border border-[#EE7E31] animate-ping" />
              </div>
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-13.75 w-54 bg-[url(/images/bg/bulletin-type-active.png)] bg-contain bg-no-repeat"
                hidden={activeTab !== tab.key}
              />
              <div className="relative z-1 w-full flex gap-2 items-center">
                <div
                  className={cn(
                    'shrink-0 py-1 px-1.5 rounded-xs relative',
                    activeTab === tab.key ? 'bg-white text-[#848589]' : 'bg-[#9f9f9f] text-[#414141]',
                    'before:absolute before:border-2 before:border-b-transparent! before:border-l-transparent! before:-bottom-1 before:right-1',
                    activeTab === tab.key ? 'before:border-white' : 'before:border-[#9f9f9f]'
                  )}
                >
                  {tab.icon}
                </div>
                <div className="flex-1">{tab.title}</div>
              </div>
            </ButtonWithAudio>
          ))}
        </div>
        <div
          className={cn(
            'flex-1 relative overflow-hidden',
            'bg-[linear-gradient(180deg,#838589_0,rgba(50,50,50,.9)_30%,rgba(50,50,50,.9)_100%)]'
          )}
        >
          {children}
        </div>
      </motion.div>
    </dialog>
  );
};

export const AnnouncementsDialog = <T extends React.Key>(props: AnnouncementsDialogProps<T>) => {
  const { open, onOpenChange } = props;

  useEffect(() => {
    if (!open) return;
    const dispose = shortcutService.register('Escape', (e: KeyboardEvent) => {
      e.preventDefault();
      onOpenChange(false);
      return true;
    });
    return () => dispose();
  }, [open, onOpenChange]);

  return <AnimatePresence>{open && <AnnouncementsDialogInner {...props} />}</AnimatePresence>;
};
