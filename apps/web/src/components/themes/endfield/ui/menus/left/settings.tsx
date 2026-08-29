import { CogIcon } from '@endfieldmap/web-components';
import { HeaderMenuTemplate } from '@themes/endfield/ui/menus/left/_template';
import { useTranslation } from 'react-i18next';

import uiManager from '@/services/ui_manager';

export const HeaderMenuSettings = ({ className }: { className?: string }) => {
  const { t } = useTranslation('header');

  const handleOpen = () => {
    uiManager.setSettingsShown(true);
  };

  return (
    <HeaderMenuTemplate icon={<CogIcon />} title={t('settings.title')} onClick={handleOpen} className={className} />
  );
};
