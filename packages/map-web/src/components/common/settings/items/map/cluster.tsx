import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { useAdapter } from '@/hooks/use_adapter';

export const ClusterSetting = observer(() => {
  const { t } = useTranslation('settings');
  const { mapDataService } = useAdapter();
  const enableCluster = mapDataService.mapStateDataService.enableCluster.value;
  return (
    <SettingItem title={t('map.cluster')} tailDeco>
      <EndfieldSwitch
        checked={enableCluster}
        onChange={(v) => (mapDataService.mapStateDataService.enableCluster.value = v)}
      />
    </SettingItem>
  );
});
