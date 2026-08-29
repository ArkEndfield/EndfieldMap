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
    fun: () =>
      Promise.all([
        service.databaseService.database.entityMark.find().remove(),
        service.databaseService.database.entityVisibility.find().remove(),
      ]),
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
