import { useTranslation } from '@endfieldmap/map-service';
import { LocalStorageDB } from '@endfieldmap/tools';
import { EndfieldFormButton } from '@endfieldmap/web-components';

import { alert } from '@/components/common/alert/alert_api';
import { Loading } from '@/components/common/settings/components/loading';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { usePromiseState } from '@/hooks/use_promise_state';
import { service } from '@/services';

const clearAll = (confirmText: string): Promise<boolean> => {
  return new Promise((resolve) => {
    alert.confirm({
      content: confirmText,
      async onConfirm() {
        // 清空用户数据库中的所有数据（触发删除事件）
        await Promise.all([LocalStorageDB.clear(), service.databaseService.clearUserDataWithEvents()]);
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
