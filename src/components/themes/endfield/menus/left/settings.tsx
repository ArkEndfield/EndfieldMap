import { CogIcon } from '@/components/common/icons';
import { HeaderMenuTemplate } from './_template';
import { ZmdAlert } from '@/components/common/endfield_components/alert';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const HeaderMenuSettings = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('header');

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <HeaderMenuTemplate icon={<CogIcon />} title={t('settings.title')} onClick={handleOpen}>
      <ZmdAlert open={open} onOpenChange={setOpen} hideCancel>
        <h1 className="text-lg font-bold text-center">{t('settings.title')}</h1>
      </ZmdAlert>
    </HeaderMenuTemplate>
  );
};
