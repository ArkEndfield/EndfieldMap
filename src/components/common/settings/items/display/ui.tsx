import { useTranslation } from 'react-i18next';

import { LayoutIcon } from '@/components/common/icons';

import { SettingsZone } from '../../components/settings_zone';
import { DarkModeSetting } from './ui/dark-mode';
import { PopupAdjustSetting } from './ui/pupup-adjust';

export const UISetting = () => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('display.layout.title')} icon={<LayoutIcon />}>
      <PopupAdjustSetting />
      <DarkModeSetting />
    </SettingsZone>
  );
};
