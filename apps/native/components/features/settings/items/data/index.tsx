import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { AllStorageSetting } from '@/components/features/settings/items/data/all';
import { EntitySetting } from '@/components/features/settings/items/data/entity';
import { StateSetting } from '@/components/features/settings/items/data/state';
import { SettingSection } from '@/components/features/settings/shared';

export const DataSettings = observer(() => {
  const { t } = useTranslation('settings');

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
      <SettingSection title={t('data.title')}>
        <StateSetting />
        <EntitySetting />
        <AllStorageSetting />
      </SettingSection>
    </ScrollView>
  );
});
