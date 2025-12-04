import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/endfield_components/alert/alert_api';
import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { Loading } from '@/components/common/settings/components/loading';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { usePromiseState } from '@/hooks/use_promise_state';
import { useAdapter } from '@/hooks/use_adapter';

export const CacheSetting = () => {
  const { t } = useTranslation('settings');
  const { dataService } = useAdapter();

  const { loading, execute } = usePromiseState({
    fun: () => dataService.storage.temporaryClear(),
    onSuccess() {
      alert.info({
        content: t('data.cache.success'),
        dismissible: false,
        onConfirm() {
          window.location.reload();
        },
      });
    },
    onFailed(e) {
      alert.info({
        content: t('data.cache.failed', { reason: e.message }),
        dismissible: false,
      });
    },
  });
  return (
    <SettingItem title={t('data.cache.title')} tailDeco>
      <EndfieldFormButton onClick={execute} left={loading && <Loading />} variant="primary">
        {t('data.cache.clear')}
      </EndfieldFormButton>
    </SettingItem>
  );
};
