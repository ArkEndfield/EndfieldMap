import { useTranslation } from 'react-i18next';
import { EndfieldSwitch } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import uiManager from '@/services/ui_manager';

export const AudioSetting = observer(() => {
  const { t } = useTranslation(['settings', 'common']);
  const audioEnabled = uiManager.audioEnabled.value;

  return (
    <SettingItem
      id={SETTINGS_KEYS.DISPLAY.AUDIO}
      title={t('settings:display.layout.audio.title')}
      description={t('settings:display.layout.audio.description')}
    >
      <EndfieldSwitch checked={audioEnabled} onChange={() => uiManager.toggleAudio()} onText={t('common:yes')} offText={t('common:no')} />
    </SettingItem>
  );
});
