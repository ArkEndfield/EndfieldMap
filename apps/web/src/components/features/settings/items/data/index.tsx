import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';

import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { AllStorageSetting } from '@/components/features/settings/items/data/all';
import { EntitySetting } from '@/components/features/settings/items/data/entity';
import { StateSetting } from '@/components/features/settings/items/data/state';

export const DataSettings = observer(() => {
  const { t } = useTranslation('settings');
  return (
    <SettingsZone title={t('data.title')}>
      <StateSetting />
      <EntitySetting />
      <AllStorageSetting />
    </SettingsZone>
  );
});
