import { HeaderMenuTemplate } from '@themes/endfield/ui/menus/left/_template';
import { useTranslation } from '@endfieldmap/map-service';

import { CogIcon } from '@/components/common/icons';
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
