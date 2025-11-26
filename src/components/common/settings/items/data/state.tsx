import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { SettingItem } from '../../components/setting_item';
import { useTranslation } from 'react-i18next';
import { usePromiseState } from '@/hooks/use_promise_state';
import { Loading } from '../../components/loading';
import { alert } from '@/components/common/endfield_components/alert_api';
import { LocalStorageDB } from '@endfieldmap/tools';

export const StateSettings = () => {
  const { t } = useTranslation('settings');
  const { loading, execute } = usePromiseState({
    fun: () => LocalStorageDB.clear(),
    onSuccess() {
      alert.info({
        content: t('data.state_data.success'),
        dismissible: false,
        onConfirm() {
          window.location.reload();
        },
      });
    },
    onFailed(e) {
      alert.info({
        content: t('data.state_data.failed', { reason:  e.message }),
        dismissible: false,
      });
    },
  });
  return (
    <SettingItem title={t('data.state_data.title')} tailDeco>
      <EndfieldFormButton className="min-w-64" onClick={execute} left={loading && <Loading />}>
        {t('data.state_data.clear')}
      </EndfieldFormButton>
    </SettingItem>
  );
};
