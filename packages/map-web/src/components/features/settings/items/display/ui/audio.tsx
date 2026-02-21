import { useTranslation } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import uiManager from '@/services/ui_manager';

export const AudioSetting = observer(() => {
  const { t } = useTranslation('settings');
  const audioEnabled = uiManager.audioEnabled.value;

  return (
    <SettingItem
      id={SETTINGS_KEYS.DISPLAY.AUDIO}
      title={t('display.layout.audio.title')}
      description={t('display.layout.audio.description')}
    >
      <EndfieldSwitch checked={audioEnabled} onChange={() => uiManager.toggleAudio()} />
    </SettingItem>
  );
});
