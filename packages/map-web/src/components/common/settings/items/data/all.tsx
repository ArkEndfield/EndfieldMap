import { LocalStorageDB } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { Loading } from '@/components/common/settings/components/loading';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { usePromiseState } from '@/hooks/use_promise_state';
import { SETTINGS_KEYS } from '@/const/settings';
import { DataService } from '@/services/data';

const clearAll = (confirmText: string): Promise<boolean> => {
  return new Promise((resolve) => {
    alert.confirm({
      content: confirmText,
      async onConfirm() {
        await Promise.all([
          LocalStorageDB.clear(),
          DataService.storage.clearAll(),
          DataService.dbStorage.database.remove(),
        ]);
        resolve(true);
      },
      onCancel() {
        resolve(false);
      },
      onDismiss() {
        resolve(false);
      },
    });
  });
};

export const AllStorageSetting = () => {
  const { t } = useTranslation('settings');
  const { loading, execute } = usePromiseState({
    fun: () => clearAll(t('data.storage_data.confirm')),
    onSuccess(cleared) {
      if (cleared) {
        alert.info({
          content: t('data.storage_data.success'),
          dismissible: false,
          onConfirm() {
            window.location.reload();
          },
        });
      }
    },
    onFailed(e) {
      alert.info({
        content: t('data.storage_data.failed', { reason: e.message }),
        dismissible: false,
      });
    },
  });
  return (
    <SettingItem
      id={SETTINGS_KEYS.DATA.ALL}
      title={t('data.storage_data.title')}
      description={t('data.storage_data.description')}
      tailDeco
    >
      <EndfieldFormButton onClick={execute} left={loading && <Loading />} variant="danger">
        {t('data.storage_data.clear')}
      </EndfieldFormButton>
    </SettingItem>
  );
};
