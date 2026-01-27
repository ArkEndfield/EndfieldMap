import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { useAdapter } from '@/hooks/use_adapter';

export const AdjustViewSetting = observer(() => {
  const { t } = useTranslation('settings');
  const { dataService } = useAdapter();
  const enableAdjustView = dataService.mapStateDataService.adjustView.value;
  return (
    <SettingItem title={t('map.adjust_view.title')} description={t('map.adjust_view.description')} tailDeco>
      <EndfieldSwitch
        checked={enableAdjustView}
        onChange={(v) => (dataService.mapStateDataService.adjustView.value = v)}
      />
    </SettingItem>
  );
});
