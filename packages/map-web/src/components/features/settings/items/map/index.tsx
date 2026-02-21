import { useTranslation } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';

import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { AdjustViewSetting } from '@/components/features/settings/items/map/adjust_view';
import { CenterViewSetting } from '@/components/features/settings/items/map/center_view';
import { ClusterSetting } from '@/components/features/settings/items/map/cluster';
import { HoverSetting } from '@/components/features/settings/items/map/hover';
import { WasdSetting } from '@/components/features/settings/items/map/wasd_movespeed';

export const MapSettings = observer(() => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('map.title')}>
      <ClusterSetting />
      <CenterViewSetting />
      <AdjustViewSetting />
      <HoverSetting />
      <WasdSetting />
    </SettingsZone>
  );
});
