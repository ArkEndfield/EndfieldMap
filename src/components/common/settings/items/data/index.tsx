import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingsZone } from '../../components/settings_zone';
import { AllStorageSettings } from './all';
import { CacheSettings } from './cache';
import { EntitySettings } from './entity';
import { StateSettings } from './state';

export const DataSetting = observer(() => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('data.title')}>
      <CacheSettings />
      <StateSettings />
      <EntitySettings />
      <AllStorageSettings />
    </SettingsZone>
  );
});
