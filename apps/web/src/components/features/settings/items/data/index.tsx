import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';

import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { AllStorageSetting } from '@/components/features/settings/items/data/all';
import { CopySentryIdsSetting } from '@/components/features/settings/items/data/copy_sentry_ids';
import { EntitySetting } from '@/components/features/settings/items/data/entity';
import { StateSetting } from '@/components/features/settings/items/data/state';

export const DataSettings = observer(() => {
  const { t } = useTranslation('settings');
  return (
    <div className="space-y-4">
      <SettingsZone title={t('data.title')}>
        <StateSetting />
        <EntitySetting />
        <AllStorageSetting />
      </SettingsZone>
      <SettingsZone title={t('data.debug.title')}>
        <CopySentryIdsSetting />
      </SettingsZone>
    </div>
  );
});
