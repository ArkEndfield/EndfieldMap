import { useTranslation } from 'react-i18next';

import { LayoutIcon } from '@/components/common/icons';
import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { DarkModeSetting } from '@/components/common/settings/items/display/ui/dark-mode';
import { PopupAdjustSetting } from '@/components/common/settings/items/display/ui/pupup-adjust';

export const UISetting = () => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('display.layout.title')} icon={<LayoutIcon />}>
      <PopupAdjustSetting />
      <DarkModeSetting />
    </SettingsZone>
  );
};
