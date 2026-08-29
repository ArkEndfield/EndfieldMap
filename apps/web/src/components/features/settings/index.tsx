import { cn } from '@endfieldmap/tools';
import { CloseButton, shortcutService, useIsMobile, useWindow } from '@endfieldmap/web-components';
import { DataBaseIcon, LayoutAndLanguageIcon, MapIcon, QuestionIcon } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { ContentWrapper } from '@/components/common/settings/components/content_wrapper';
import { BgDeco } from '@/components/common/settings/components/deco';
import { type TabItem, TabList } from '@/components/common/settings/tabs';
import { AboutPage } from '@/components/features/settings/items/about';
import { DataSettings } from '@/components/features/settings/items/data';
import { DisplaySettings } from '@/components/features/settings/items/display';
import { MapSettings } from '@/components/features/settings/items/map';
import { SETTINGS_PAGE } from '@/const/settings';
import uiManager from '@/services/ui_manager';

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
    key: SETTINGS_PAGE.GENERAL,
    icon: <MapIcon />,
    Component: MapSettings,
  },
  {
    key: SETTINGS_PAGE.DISPLAY,
    icon: <LayoutAndLanguageIcon />,
    Component: DisplaySettings,
  },
  {
    key: SETTINGS_PAGE.DATA,
    icon: <DataBaseIcon />,
    Component: DataSettings,
  },
  {
    key: SETTINGS_PAGE.ABOUT,
    icon: <QuestionIcon />,
    Component: AboutPage,
  },
] as const;

const Settings: React.FC<SettingsPageProps> = observer(({ open, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isMobile = useIsMobile();
  const activeTab = uiManager.settingsTab as (typeof settingList)[number]['key'];
  const setActiveTab = (key: string) => uiManager.navigateSettings(key);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  useEffect(() => {
    const dispose = shortcutService.register('Escape', (e: KeyboardEvent) => {
      e.preventDefault();
      onClose();
      return true;
    });
    return () => dispose();
  }, [onClose]);

  useEffect(() => {
    if (open && uiManager.targetSettingItem) {
      // Small delay to ensure content is rendered
      const timer = setTimeout(() => {
        const element = document.getElementById(uiManager.targetSettingItem!);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Wait for animation entrance
      return () => clearTimeout(timer);
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
});

export const SettingsPage: React.FC = observer(() => {
  const open = uiManager.settingsShown;
  const currentWindow = useWindow();
  const onClose = () => uiManager.setSettingsShown(false);
  return createPortal(
    <AnimatePresence>{open && <Settings open={open} onClose={onClose} />}</AnimatePresence>,
    currentWindow.document.body
  );
});
