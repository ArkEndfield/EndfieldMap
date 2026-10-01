import { useTranslation } from 'react-i18next';

import { ActionButton, SettingRow } from '@/components/features/settings/shared';
import { alertApi } from '@/components/ui/alert';
import { usePromiseState } from '@/hooks/use-promise-state';
import { service } from '@/services/map-service';

export const EntitySetting = () => {
  const { t } = useTranslation('settings');

  const { loading, execute } = usePromiseState({
    fun: async () => {
      // 与 web 侧同口径：先停同步并清 replication 元数据，删除后 cleanup(0)
      // 物理抹掉墓碑——否则墓碑会在下次同步时把云端标记一并删光
      await service.userService.stopSyncAndPurgeMeta();
      await Promise.all([
        service.databaseService.database.entityMark.find().remove(),
        service.databaseService.database.entityVisibility.find().remove(),
      ]);
      await Promise.all([
        service.databaseService.database.entityMark.cleanup(0),
        service.databaseService.database.entityVisibility.cleanup(0),
      ]);
    },
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
