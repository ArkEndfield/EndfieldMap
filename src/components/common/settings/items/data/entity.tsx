import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { SettingItem } from '../../components/setting_item';
import { useTranslation } from 'react-i18next';
import { usePromiseState } from '@/hooks/use_promise_state';
import { dataService } from '@/services/data';
import { Loading } from '../../components/loading';
import { alert } from '@/components/common/endfield_components/alert/alert_api';
import { StorageKey } from '@endfieldmap/tools';

export const EntitySettings = () => {
  const { t } = useTranslation('settings');
  const { loading, execute } = usePromiseState({
    fun: () =>
      Promise.all([
        dataService.storage.permanentRemove(StorageKey.LAYERS_VISIBILITY),
        dataService.storage.permanentRemove(StorageKey.MARKED_FEATURES),
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
    <SettingItem title={t('data.entity_data.title')} description={t('data.entity_data.description')} tailDeco>
      <EndfieldFormButton onClick={execute} left={loading && <Loading />}>
        {t('data.entity_data.clear')}
      </EndfieldFormButton>
    </SettingItem>
  );
};
