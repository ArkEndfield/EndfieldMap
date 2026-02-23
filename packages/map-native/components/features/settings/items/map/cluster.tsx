import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';

import { SettingRow } from '@/components/features/settings/shared';
import { service } from '@/services/map-service';

export const ClusterSetting = observer(() => {
  const { t } = useTranslation('settings');
  const enableCluster = service.dataService.mapDataService.mapStateDataService.enableCluster.value;

  return (
    <SettingRow title={t('map.cluster')}>
      <Switch
        value={enableCluster}
        onValueChange={(v) => {
          service.dataService.mapDataService.mapStateDataService.enableCluster.value = v;
        }}
        trackColor={{ false: '#767577', true: '#007AFF' }}
      />
    </SettingRow>
  );
});
