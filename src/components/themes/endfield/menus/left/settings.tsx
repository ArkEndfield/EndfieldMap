import { CogIcon } from '@/components/common/icons';
import { HeaderMenuTemplate } from './_template';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsPage } from '@/components/common/settings';

export const HeaderMenuSettings = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('header');

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <HeaderMenuTemplate icon={<CogIcon />} title={t('settings.title')} onClick={handleOpen}>
      <SettingsPage open={open} onClose={() => setOpen(false)} />
    </HeaderMenuTemplate>
  );
};
