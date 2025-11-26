import { CogIcon } from '@/components/common/icons';
import { HeaderMenuTemplate } from './_template';
import { useTranslation } from 'react-i18next';
import uiManager from '@/services/ui_manager';

export const HeaderMenuSettings = () => {
  const { t } = useTranslation('header');

  const handleOpen = () => {
    uiManager.setSettingsShown(true);
  };

  return (
    <HeaderMenuTemplate icon={<CogIcon />} title={t('settings.title')} onClick={handleOpen} />
  );
};
