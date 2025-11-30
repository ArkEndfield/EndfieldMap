import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useIsMobile } from '@/hooks/use_is_mobile';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';

import { CloseButton } from '../close_button';
import { DataBaseIcon, LayoutAndLanguageIcon,MapIcon, QuestionIcon } from '../icons';
import { ScrollArea } from '../scroll_area';
import { AboutPage } from './items/about';
import { DataSetting } from './items/data';
import { DisplaySettings } from './items/display';
import { MapSetting } from './items/map';
import { type TabItem,TabList } from './tabs';

export interface SettingsPageProps {
  open: boolean;
  onClose: () => void;
}

export interface SettingsProps {
  onClose: () => void;
}

export interface SettingItem<T extends string> extends TabItem<T> {
  Component: React.FC;
}

const settingList = [
  {
    key: 'general',
    icon: <MapIcon />,
    Component: MapSetting,
  },
  {
    key: 'display',
    icon: <LayoutAndLanguageIcon />,
    Component: DisplaySettings,
  },
  {
    key: 'data',
    icon: <DataBaseIcon />,
    Component: DataSetting,
  },
  {
    key: 'about',
    icon: <QuestionIcon />,
    Component: AboutPage,
  },
] as const;

const BgDeco = () => (
  <div className="absolute -z-1 left-5 select-none">
    <div className="relative w-30 h-25 -top-2 bg-no-repeat bg-contain opacity-10 bg-[url(/images/bg/deco_common_logo_bg.png)]"></div>
    <div className="font-[Outfit] absolute top-2 left-2">
      <svg
        width="40"
        height="10"
        viewBox="0 0 40 10"
        fill="none"
        className="text-[#666]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text x="0" y="5" fill="currentColor" fontSize="4" fontFamily="Outfit" fontWeight="400">
          绝命笋干JMSG
        </text>
        <text x="0" y="10" fill="currentColor" fontSize="4" fontFamily="Outfit" fontWeight="400">
          ZMDMAP
        </text>
      </svg>
      <div className="flex items-center">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="14" x2="8" y2="0" stroke="currentColor" strokeWidth="2" />
        </svg>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="14" x2="8" y2="0" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="ml-1">SETTINGS</span>
      </div>
    </div>
  </div>
);

const ContentWrapper = ({ children, active }: { children: React.ReactNode; active?: boolean }) =>
  active ? (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0.5 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <ScrollArea className="w-full h-full overflow-hidden">{children}</ScrollArea>
    </motion.div>
  ) : null;

const Settings: React.FC<SettingsPageProps> = ({ open, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<(typeof settingList)[number]['key']>(settingList[0].key);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  return (
    <motion.dialog
      ref={dialogRef}
      className="fixed flex flex-col top-0 left-0 w-screen h-screen inset-0 z-20 bg-black/50 text-white backdrop-blur-sm max-w-screen max-h-screen overflow-hidden backdrop:bg-transparent"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { delay: 0.1 } }}
      transition={{ duration: 0.1, type: 'tween' }}
    >
      <motion.div
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        exit={{ y: '-100%', transition: { delay: 0 } }}
        transition={{ duration: 0.1, delay: 0.1 }}
        className="flex justify-center shrink-0 grow-0 relative z-2"
      >
        <BgDeco />
        <TabList menus={settingList} activeTab={activeTab} setActiveTab={setActiveTab} className="mx-auto" />
        <CloseButton className={cn('absolute ', isMobile ? 'right-4' : 'right-8')} onClose={onClose} />
      </motion.div>
      <motion.div
        initial={{ y: '3em', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '3em', opacity: 0.5, transition: { delay: 0 } }}
        transition={{ duration: 0.1, delay: 0.1 }}
        className="flex-1 overflow-hidden relative z-2"
      >
        {settingList.map(({ key, Component }) => (
          <ContentWrapper key={key} active={activeTab === key}>
            <Component />
          </ContentWrapper>
        ))}
      </motion.div>
    </motion.dialog>
  );
};

export const SettingsPage: React.FC = observer(() => {
  const open = uiManager.settingsShown;
  const onClose = () => uiManager.setSettingsShown(false);
  return createPortal(
    <AnimatePresence>{open && <Settings open={open} onClose={onClose} />}</AnimatePresence>,
    document.body
  );
});
