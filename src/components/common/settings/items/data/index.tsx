import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingsZone } from '../../components/settings_zone';
import { AllStorageSetting } from './all';
import { CacheSetting } from './cache';
import { EntitySetting } from './entity';
import { StateSetting } from './state';

export const DataSettings = observer(() => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('data.title')}>
      <CacheSetting />
      <StateSetting />
      <EntitySetting />
      <AllStorageSetting />
    </SettingsZone>
  );
});
