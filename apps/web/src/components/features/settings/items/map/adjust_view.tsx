import { EndfieldSwitch } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { service } from '@/services';

export const AdjustViewSetting = observer(() => {
  const { t } = useTranslation(['settings', 'common']);
  const enableAdjustView = service.dataService.mapDataService.mapStateDataService.adjustView.value;
  return (
    <SettingItem
      id={SETTINGS_KEYS.GENERAL.ADJUST_VIEW}
      title={t('settings:map.adjust_view.title')}
      description={t('settings:map.adjust_view.description')}
      tailDeco
    >
      <EndfieldSwitch
        checked={enableAdjustView}
        onChange={(v) => (service.dataService.mapDataService.mapStateDataService.adjustView.value = v)}
        onText={t('common:yes')}
        offText={t('common:no')}
      />
    </SettingItem>
  );
});
