import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { useAdapter } from '@/hooks/use_adapter';

export const AdjustViewSetting = observer(() => {
  const { t } = useTranslation('settings');
  const { mapDataService } = useAdapter();
  const enableAdjustView = mapDataService.mapStateDataService.adjustView.value;
  return (
    <SettingItem
      id={SETTINGS_KEYS.GENERAL.ADJUST_VIEW}
      title={t('map.adjust_view.title')}
      description={t('map.adjust_view.description')}
      tailDeco
    >
      <EndfieldSwitch
        checked={enableAdjustView}
        onChange={(v) => (mapDataService.mapStateDataService.adjustView.value = v)}
      />
    </SettingItem>
  );
});
