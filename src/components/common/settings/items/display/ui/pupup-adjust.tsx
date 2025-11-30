import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import uiManager from '@/services/ui_manager';

import { SettingItem } from '../../../components/setting_item';

export const PopupAdjustSetting = observer(() => {
  const { t } = useTranslation('settings');
  const isAdjust = uiManager.adjustPopup;

  return (
    <SettingItem
      title={t('display.layout.popup.right_adjust.title')}
      description={t('display.layout.popup.right_adjust.description')}
    >
      <EndfieldSwitch checked={isAdjust} onChange={() => uiManager.toggleAdjustPopup()} />
    </SettingItem>
  );
});
