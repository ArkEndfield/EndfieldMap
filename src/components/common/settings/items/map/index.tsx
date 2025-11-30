import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { AdjustViewSetting } from '@/components/common/settings/items/map/adjust_view';
import { CenterViewSetting } from '@/components/common/settings/items/map/center_view';
import { ClusterSetting } from '@/components/common/settings/items/map/cluster';
import { HoverSetting } from '@/components/common/settings/items/map/hover';

export const MapSettings = observer(() => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('map.title')}>
      <ClusterSetting />
      <CenterViewSetting />
      <AdjustViewSetting />
      <HoverSetting />
    </SettingsZone>
  );
});
