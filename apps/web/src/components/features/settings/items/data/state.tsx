import { EndfieldFormButton } from '@endfieldmap/web-components';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { Loading } from '@/components/common/settings/components/loading';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { usePromiseState } from '@/hooks/use_promise_state';
import { service } from '@/services';

export const StateSetting = () => {
  const { t } = useTranslation('settings');
  const { loading, execute } = usePromiseState({
    fun: () => service.dataService.mapDataService.mapStateDataService.clearState(),
    onSuccess() {
      alert.info({
        content: t('data.state_data.success'),
      });
    },
    onFailed(e) {
      alert.info({
        content: t('data.state_data.failed', { reason: e.message }),
        dismissible: false,
      });
    },
  });
  return (
    <SettingItem
      id={SETTINGS_KEYS.DATA.STATE}
      title={t('data.state_data.title')}
      description={t('data.state_data.description')}
      tailDeco
    >
      <EndfieldFormButton onClick={execute} left={loading && <Loading />}>
        {t('data.state_data.clear')}
      </EndfieldFormButton>
    </SettingItem>
  );
};
