import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingsZone } from '../../components/settings_zone';
import { AdjustViewSetting } from './adjust_view';
import { CenterViewSetting } from './center_view';
import { ClusterSetting } from './cluster';
import { HoverSetting } from './hover';

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
