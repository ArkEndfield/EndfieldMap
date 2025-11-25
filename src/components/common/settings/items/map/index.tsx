import { useTranslation } from 'react-i18next';
import { SettingsZone } from '../../components/settings_zone';
import { SettingItem } from '../../components/setting_item';
import { useAdapter } from '@/hooks/use_adapter';
import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { observer } from 'mobx-react-lite';
import { dataService } from '@/services/data';

export const MapSetting = observer(() => {
  const { t } = useTranslation('settings');
  const { adapter } = useAdapter();
  const enableCluster = !adapter.entityController.disableCluster;
  return (
    <SettingsZone title={t('map.title')}>
      <SettingItem title={t('map.cluster')} tailDeco>
        <EndfieldSwitch
          className="min-w-64"
          checked={enableCluster}
          onChange={(v) => dataService.setEnableCluster(v)}
        />
      </SettingItem>
    </SettingsZone>
  );
});
