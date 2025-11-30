import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingsZone } from '../../components/settings_zone';
import { CenterViewSettings } from './center_view';
import { ClusterSettings } from './cluster';
import { HoverSettings } from './hover';

export const MapSetting = observer(() => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('map.title')}>
      <ClusterSettings />
      <CenterViewSettings />
      <HoverSettings />
    </SettingsZone>
  );
});
