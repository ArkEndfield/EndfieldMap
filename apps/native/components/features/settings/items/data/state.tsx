import { useTranslation } from 'react-i18next';

import { ActionButton, SettingRow } from '@/components/features/settings/shared';
import { alertApi } from '@/components/ui/alert';
import { usePromiseState } from '@/hooks/use-promise-state';
import { service } from '@/services/map-service';

export const StateSetting = () => {
  const { t } = useTranslation('settings');

  const { loading, execute } = usePromiseState({
    fun: () => service.dataService.mapDataService.mapStateDataService.clearState(),
    onSuccess() {
      alertApi.info({ content: t('data.state_data.success') });
    },
    onFailed(e) {
      alertApi.info({
        content: t('data.state_data.failed', { reason: e.message }),
      });
    },
  });

  return (
    <SettingRow title={t('data.state_data.title')} description={t('data.state_data.description')}>
      <ActionButton
        label={t('data.state_data.clear')}
        loading={loading}
        disabled={loading}
        onPress={execute}
      />
    </SettingRow>
  );
};
