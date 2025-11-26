import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { SettingItem } from '../../components/setting_item';
import { useTranslation } from 'react-i18next';
import { usePromiseState } from '@/hooks/use_promise_state';
import { dataService } from '@/services/data';
import { Loading } from '../../components/loading';
import { alert } from '@/components/common/endfield_components/alert_api';

export const CacheSettings = () => {
  const { t } = useTranslation('settings');
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
      <EndfieldFormButton className="min-w-64" onClick={execute} left={loading && <Loading />} variant="primary">
        {t('data.cache.clear')}
      </EndfieldFormButton>
    </SettingItem>
  );
};
