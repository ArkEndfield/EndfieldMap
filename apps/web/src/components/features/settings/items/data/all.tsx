import { LocalStorageDB } from '@endfieldmap/tools';
import { EndfieldFormButton } from '@endfieldmap/web-components';
import { useTranslation } from 'react-i18next';

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
        // 先停同步并清 replication 元数据，再整体丢弃当前角色库：
        // 软删留下的墓碑会在下次登录续订同步时被推上云，把云端数据删光。
        // 丢弃后立刻走 logout(false) 重建空 legacy 库，避免弹窗期间
        // user_db 为 null 让响应式读取 database getter 的代码抛错
        await service.userService.stopSyncAndPurgeMeta();
        await service.databaseService.removeUserDatabase();
        await service.userService.logout(false);
        LocalStorageDB.clear();
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
