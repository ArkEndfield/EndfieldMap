import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import uiManager from '@/services/ui_manager';

export const AudioSetting = observer(() => {
  const { t } = useTranslation('settings');
  const audioEnabled = uiManager.audioEnabled.value;

  return (
    <SettingItem title={t('display.layout.audio.title')} description={t('display.layout.audio.description')}>
      <EndfieldSwitch checked={audioEnabled} onChange={() => uiManager.toggleAudio()} />
    </SettingItem>
  );
});
