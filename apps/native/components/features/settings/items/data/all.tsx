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
  // 停同步并清 replication 元数据 → 物理丢弃全部本地用户库（legacy 快照与
  // 其他角色库一并清，否则下次登录「保留」迁移时旧数据会回来）→ 走登出
  // 换库流程 → 清 storage。否则清后内存仍持登录态、同步停摆整会话、
  // 新写入成孤儿数据
  const scopes = service.userService.getKnownDatabaseScopes();
  await service.userService.stopSyncAndPurgeMeta();
  await service.databaseService.removeAllUserDatabases(scopes);
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
        alertApi.info({ content: t('data.storage_data.success_in_place') });
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
