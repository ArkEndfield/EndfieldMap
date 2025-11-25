import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TabList, type TabItem } from './tabs';
import { ScrollArea } from '../scroll_area';
import { CogIcon, QuestionIcon, TranslateIcon } from '../icons';
import { LanguageSetting } from './items/language';

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
    icon: <CogIcon />,
    Component: () => (
      <div className="h-[1000px]">
        通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用通用
      </div>
    ),
  },
  {
    key: 'language',
    icon: <TranslateIcon />,
    Component: LanguageSetting,
  },
  {
    key: 'about',
    icon: <QuestionIcon />,
    Component: () => <div>关于</div>,
  },
] as const;

const BgDeco = () => (
  <div className="absolute -z-1 left-5 select-none">
    <div className="relative w-30 h-25 -top-2 bg-no-repeat bg-contain opacity-10 bg-[url(/images/bg/deco_common_logo_bg.png)]"></div>
    <div className="font-[Outfit] absolute top-2 left-2">
      <svg width="40" height="10" viewBox="0 0 40 10" fill="none" className='text-[#666]' xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="5" fill="currentColor" fontSize="4" fontFamily="Outfit" fontWeight="400">绝命笋干JMSG</text>
        <text x="0" y="10" fill="currentColor" fontSize="4" fontFamily="Outfit" fontWeight="400">ZMDMAP</text>
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

const CloseButton = ({ onClose }: SettingsProps) => (
  <button
    className="absolute shrink-0 grow-0 top-4 right-8 w-6.5 h-6.5 flex justify-center items-center rounded-full text-[#FFFEFE] hover:text-[#c9c9c9] transition-colors drop-shadow-sm"
    onClick={onClose}
  >
    <svg width="100%" height="100%" viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M37.5 0C58.2107 0 75 16.7893 75 37.5C75 58.2107 58.2107 75 37.5 75C16.7893 75 0 58.2107 0 37.5C0 16.7893 16.7893 0 37.5 0ZM40.3301 40.3271L37.502 43.1553L56.8457 62.5L62.5029 56.8428L43.1592 37.499L40.3301 40.3271ZM37.498 31.8457L18.1543 12.502L12.498 18.1582L31.8408 37.501L12.502 56.8398L18.1582 62.4961L37.5049 43.1504L34.6758 40.3223L31.8506 37.4971L34.6719 34.6758L37.498 31.8486L43.1533 37.5039L62.501 18.1562L56.8447 12.5L37.498 31.8457Z"
        fill="currentColor"
      />
    </svg>
  </button>
);

const ContentWrapper = ({ children, active }: { children: React.ReactNode; active?: boolean }) =>
  active ? (
    <motion.div
      initial={{ scale: 1.01, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.01, opacity: 0.5 }}
      transition={{ duration: 0.1 }}
    >
      <ScrollArea className="w-full h-full overflow-hidden">{children}</ScrollArea>
    </motion.div>
  ) : null;

const Settings: React.FC<SettingsPageProps> = ({ open, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
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
      className="fixed flex flex-col top-0 left-0 w-screen h-screen inset-0 z-20 bg-black/50 text-white backdrop-blur-sm max-w-screen max-h-screen backdrop:bg-transparent"
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
        <CloseButton onClose={onClose} />
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

export const SettingsPage: React.FC<SettingsPageProps> = ({ open, onClose }) =>
  createPortal(<AnimatePresence>{open && <Settings open={open} onClose={onClose} />}</AnimatePresence>, document.body);
