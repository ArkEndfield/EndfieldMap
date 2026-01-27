import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { AllStorageSetting } from '@/components/common/settings/items/data/all';
import { CacheSetting } from '@/components/common/settings/items/data/cache';
import { EntitySetting } from '@/components/common/settings/items/data/entity';
import { StateSetting } from '@/components/common/settings/items/data/state';

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
