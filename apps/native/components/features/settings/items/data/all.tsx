import { LocalStorageDB } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';

import { ActionButton, SettingRow } from '@/components/features/settings/shared';
import { alertApi } from '@/components/ui/alert';
import { usePromiseState } from '@/hooks/use-promise-state';
import { service } from '@/services/map-service';

const clearAll = async (confirmText: string): Promise<boolean> => {
  const confirmed = await alertApi.confirm({ content: confirmText });
  if (!confirmed) return false;
  await service.userService.stopSyncBeforeLocalClear();
  await service.databaseService.clearUserDataWithEvents();
  LocalStorageDB.clear();
  return true;
};

export const AllStorageSetting = () => {
  const { t } = useTranslation('settings');

  const { loading, execute } = usePromiseState({
    fun: () => clearAll(t('data.storage_data.confirm')),
    onSuccess(cleared) {
      if (cleared) {
        alertApi.info({ content: t('data.storage_data.success') });
      }
    },
    onFailed(e) {
      alertApi.info({
        content: t('data.storage_data.failed', { reason: e.message }),
      });
    },
  });

  return (
    <SettingRow
      title={t('data.storage_data.title')}
      description={t('data.storage_data.description')}
      last
    >
      <ActionButton
        label={t('data.storage_data.clear')}
        loading={loading}
        disabled={loading}
        variant="danger"
        onPress={execute}
      />
    </SettingRow>
  );
};
