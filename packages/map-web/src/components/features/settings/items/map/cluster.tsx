import { useTranslation } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { service } from '@/services';

export const ClusterSetting = observer(() => {
  const { t } = useTranslation('settings');
  const enableCluster = service.dataService.mapDataService.mapStateDataService.enableCluster.value;
  return (
    <SettingItem id={SETTINGS_KEYS.GENERAL.CLUSTER} title={t('map.cluster')} tailDeco>
      <EndfieldSwitch
        checked={enableCluster}
        onChange={(v) => (service.dataService.mapDataService.mapStateDataService.enableCluster.value = v)}
      />
    </SettingItem>
  );
});
