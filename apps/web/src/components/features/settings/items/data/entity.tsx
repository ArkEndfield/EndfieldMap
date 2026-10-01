import { EndfieldFormButton } from '@endfieldmap/web-components';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { Loading } from '@/components/common/settings/components/loading';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { usePromiseState } from '@/hooks/use_promise_state';
import { service } from '@/services';

export const EntitySetting = () => {
  const { t } = useTranslation('settings');

  const { loading, execute } = usePromiseState({
    fun: async () => {
      // 墓碑与 replication 元数据都必须物理清除：同步运行中删除会把云端
      // 标记一并删光；只停同步的话，重载后 replication 又会把墓碑推上云
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
      alert.info({
        content: t('data.entity_data.success'),
        dismissible: false,
        onConfirm() {
          window.location.reload();
        },
      });
    },
    onFailed(e) {
      alert.info({
        content: t('data.entity_data.failed', { reason: e.message }),
        dismissible: false,
      });
    },
  });
  return (
    <SettingItem
      id={SETTINGS_KEYS.DATA.ENTITY}
      title={t('data.entity_data.title')}
      description={t('data.entity_data.description')}
      tailDeco
    >
      <EndfieldFormButton onClick={execute} left={loading && <Loading />}>
        {t('data.entity_data.clear')}
      </EndfieldFormButton>
    </SettingItem>
  );
};
