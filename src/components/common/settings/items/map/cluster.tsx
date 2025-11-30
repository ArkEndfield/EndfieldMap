import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { useAdapter } from '@/hooks/use_adapter';
import { dataService } from '@/services/data';

import { SettingItem } from '../../components/setting_item';

export const ClusterSettings = observer(() => {
  const { t } = useTranslation('settings');
  const { adapter } = useAdapter();
  const enableCluster = !adapter.entityController.disableCluster;
  return (
    <SettingItem title={t('map.cluster')} tailDeco>
      <EndfieldSwitch checked={enableCluster} onChange={(v) => dataService.setEnableCluster(v)} />
    </SettingItem>
  );
});
