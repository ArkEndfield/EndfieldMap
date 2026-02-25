import { useTranslation } from '@endfieldmap/map-service';
import { EndfieldSwitch } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import uiManager from '@/services/ui_manager';

export const PopupAdjustSetting = observer(() => {
  const { t } = useTranslation(['settings', 'common']);
  const isAdjust = uiManager.adjustPopup.value;

  return (
    <SettingItem
      id={SETTINGS_KEYS.DISPLAY.POPUP}
      title={t('settings:display.layout.popup.right_adjust.title')}
      description={t('settings:display.layout.popup.right_adjust.description')}
    >
      <EndfieldSwitch checked={isAdjust} onChange={() => uiManager.toggleAdjustPopup()} onText={t('common:yes')} offText={t('common:no')} />
    </SettingItem>
  );
});
