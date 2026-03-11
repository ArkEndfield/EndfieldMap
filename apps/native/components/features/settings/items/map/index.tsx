import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { ClusterSetting } from '@/components/features/settings/items/map/cluster';
import { SettingSection } from '@/components/features/settings/shared';

export const MapSettings = observer(() => {
  const { t } = useTranslation('settings');

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
      <SettingSection title={t('map.title')}>
        <ClusterSetting />
      </SettingSection>
    </ScrollView>
  );
});
