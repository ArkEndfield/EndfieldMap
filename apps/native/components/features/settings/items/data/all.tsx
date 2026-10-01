import { LocalStorageDB } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';

import { ActionButton, SettingRow } from '@/components/features/settings/shared';
import { alertApi } from '@/components/ui/alert';
import { usePromiseState } from '@/hooks/use-promise-state';
import { service } from '@/services/map-service';

const clearAll = async (confirmText: string): Promise<boolean> => {
  const confirmed = await alertApi.confirm({ content: confirmText });
  if (!confirmed) return false;
  // 与 web 的「重载生效」对齐：native 无法 reload，改为把内存态完整复位——
  // 停同步并清 replication 元数据 → 物理丢弃活跃库 → 走登出换库流程 →
  // 清 storage。否则清后内存仍持登录态、同步停摆整会话、新写入成孤儿数据
  await service.userService.stopSyncAndPurgeMeta();
  await service.databaseService.removeUserDatabase();
  await service.userService.logout(false);
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
