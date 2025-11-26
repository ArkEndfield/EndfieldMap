import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { SettingItem } from '../../components/setting_item';
import { useTranslation } from 'react-i18next';
import { usePromiseState } from '@/hooks/use_promise_state';
import { Loading } from '../../components/loading';
import { alert } from '@/components/common/endfield_components/alert_api';
import { LocalStorageDB } from '@endfieldmap/tools';
import { dataService } from '@/services/data';

const clearAll = (confirmText: string): Promise<boolean> => {
  return new Promise((resolve) => {
    alert.confirm({
      content: confirmText,
      async onConfirm() {
        await Promise.all([LocalStorageDB.clear(), dataService.storage.clearAll()]);
        resolve(true);
      },
      onCancel() {
        resolve(false);
      },
    });
  });
};

export const AllStorageSettings = () => {
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
    <SettingItem title={t('data.storage_data.title')} tailDeco>
      <EndfieldFormButton className="min-w-64" onClick={execute} left={loading && <Loading />} variant="danger">
        {t('data.storage_data.clear')}
      </EndfieldFormButton>
    </SettingItem>
  );
};
