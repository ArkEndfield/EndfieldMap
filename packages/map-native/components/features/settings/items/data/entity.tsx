import { useTranslation } from 'react-i18next';

import { ActionButton, SettingRow } from '@/components/features/settings/shared';
import { alertApi } from '@/components/ui/alert';
import { usePromiseState } from '@/hooks/use-promise-state';
import { service } from '@/services/map-service';

export const EntitySetting = () => {
  const { t } = useTranslation('settings');

  const { loading, execute } = usePromiseState({
    fun: () =>
      Promise.all([
        service.databaseService.database.entityMark.find().remove(),
        service.databaseService.database.entityVisibility.find().remove(),
      ]),
    onSuccess() {
      alertApi.info({ content: t('data.entity_data.success') });
    },
    onFailed(e) {
      alertApi.info({
        content: t('data.entity_data.failed', { reason: e.message }),
      });
    },
  });

  return (
    <SettingRow
      title={t('data.entity_data.title')}
      description={t('data.entity_data.description')}
    >
      <ActionButton
        label={t('data.entity_data.clear')}
        loading={loading}
        disabled={loading}
        onPress={execute}
      />
    </SettingRow>
  );
};
