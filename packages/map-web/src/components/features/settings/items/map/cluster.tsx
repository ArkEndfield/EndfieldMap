import { useTranslation } from '@endfieldmap/map-service';
import { EndfieldSwitch } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { service } from '@/services';

export const ClusterSetting = observer(() => {
  const { t } = useTranslation(['settings', 'common']);
  const enableCluster = service.dataService.mapDataService.mapStateDataService.enableCluster.value;
  return (
    <SettingItem id={SETTINGS_KEYS.GENERAL.CLUSTER} title={t('settings:map.cluster')} tailDeco>
      <EndfieldSwitch
        checked={enableCluster}
        onChange={(v) => (service.dataService.mapDataService.mapStateDataService.enableCluster.value = v)}
        onText={t('common:yes')}
        offText={t('common:no')}
      />
    </SettingItem>
  );
});
