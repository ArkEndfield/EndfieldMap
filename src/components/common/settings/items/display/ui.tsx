import { useTranslation } from 'react-i18next';
import { SettingsZone } from '../../components/settings_zone';
import { LayoutIcon } from '@/components/common/icons';
import { PopupAdjustSetting } from './ui/pupup-adjust';
import { DarkModeSetting } from './ui/dark-mode';

export const UISetting = () => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('display.layout.title')} icon={<LayoutIcon />}>
      <PopupAdjustSetting />
      <DarkModeSetting />
    </SettingsZone>
  );
};
