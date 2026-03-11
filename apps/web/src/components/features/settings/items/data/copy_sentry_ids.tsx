import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { getStoredSentryEventIds } from '@/services/logger';
import { EndfieldFormButton } from '@endfieldmap/web-components';

export const CopySentryIdsSetting = () => {
  const { t } = useTranslation('settings');

  const handleCopy = async () => {
    const ids = getStoredSentryEventIds();
    if (ids.length === 0) {
      alert.info({ content: t('data.debug.copy_sentry_ids.empty') });
      return;
    }
    try {
      await navigator.clipboard.writeText(ids.join('\n'));
      alert.info({ content: t('data.debug.copy_sentry_ids.success', { count: ids.length }) });
    } catch {
      alert.info({ content: t('data.debug.copy_sentry_ids.failed') });
    }
  };

  return (
    <SettingItem
      id={SETTINGS_KEYS.DATA.COPY_SENTRY_IDS}
      title={t('data.debug.copy_sentry_ids.title')}
      description={t('data.debug.copy_sentry_ids.description')}
      tailDeco
    >
      <EndfieldFormButton onClick={handleCopy} variant="default">
        {t('data.debug.copy_sentry_ids.copy')}
      </EndfieldFormButton>
    </SettingItem>
  );
};
