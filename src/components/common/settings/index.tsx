import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CloseButton } from '@/components/common/close_button';
import { DataBaseIcon, LayoutAndLanguageIcon, MapIcon, QuestionIcon } from '@/components/common/icons';
import { AboutPage } from '@/components/common/settings/items/about';
import { DataSettings } from '@/components/common/settings/items/data';
import { DisplaySettings } from '@/components/common/settings/items/display';
import { MapSettings } from '@/components/common/settings/items/map';
import { type TabItem, TabList } from '@/components/common/settings/tabs';
import { BgDeco } from '@/components/common/settings/components/deco';
import { useIsMobile } from '@/hooks/use_is_mobile';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';
import { ContentWrapper } from './components/content_wrapper';
import { domEventListener } from '@endfieldmap/tools';

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
    Component: MapSettings,
  },
  {
    key: 'display',
    icon: <LayoutAndLanguageIcon />,
    Component: DisplaySettings,
  },
  {
    key: 'data',
    icon: <DataBaseIcon />,
    Component: DataSettings,
  },
  {
    key: 'about',
    icon: <QuestionIcon />,
    Component: AboutPage,
  },
] as const;

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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      const dispose = domEventListener(dialog, 'keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      });
      return () => dispose();
    }
  }, [onClose]);

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
