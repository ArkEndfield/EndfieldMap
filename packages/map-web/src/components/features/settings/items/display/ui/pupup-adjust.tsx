import { useTranslation } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';

import { EndfieldSwitch } from '@endfieldmap/web-components';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import uiManager from '@/services/ui_manager';

export const PopupAdjustSetting = observer(() => {
  const { t } = useTranslation('settings');
  const isAdjust = uiManager.adjustPopup.value;

  return (
    <SettingItem
      id={SETTINGS_KEYS.DISPLAY.POPUP}
      title={t('display.layout.popup.right_adjust.title')}
      description={t('display.layout.popup.right_adjust.description')}
    >
      <EndfieldSwitch checked={isAdjust} onChange={() => uiManager.toggleAdjustPopup()} />
    </SettingItem>
  );
});
