import { useTranslation } from 'react-i18next';
import { SettingsZone } from '../../components/settings_zone';
import { observer } from 'mobx-react-lite';
import { CacheSettings } from './cache';
import { StateSettings } from './state';
import { EntitySettings } from './entity';
import { AllStorageSettings } from './all';

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
