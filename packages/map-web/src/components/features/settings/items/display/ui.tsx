import { useTranslation } from '@endfieldmap/map-service';

import { LayoutIcon } from '@/components/common/icons';
import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { AudioSetting } from '@/components/features/settings/items/display/ui/audio';
import { DarkModeSetting } from '@/components/features/settings/items/display/ui/dark-mode';
import { PopupAdjustSetting } from '@/components/features/settings/items/display/ui/pupup-adjust';

export const UISetting = () => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('display.layout.title')} icon={<LayoutIcon />}>
      <PopupAdjustSetting />
      <DarkModeSetting />
      <AudioSetting />
    </SettingsZone>
  );
};
