import { EndfieldFormButton } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { sentryDiagnosticsStore } from '@/services/sentry_diagnostics';

const MAX_VISIBLE_EVENT_IDS = 5;

export const CopySentryIdsSetting = observer(() => {
  const { t } = useTranslation('settings');
  const deviceId = sentryDiagnosticsStore.getDeviceId();
  const eventIds = sentryDiagnosticsStore.eventIds;
  const recentEventIds = eventIds.slice(-MAX_VISIBLE_EVENT_IDS).reverse();
  const eventCount = eventIds.length;

  const handleCopyDeviceId = async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
      alert.info({ content: t('data.debug.copy_sentry_ids.copy_device_success') });
    } catch {
      alert.info({ content: t('data.debug.copy_sentry_ids.failed') });
    }
  };

  const handleCopyAllEventIds = async () => {
    if (eventIds.length === 0) {
      alert.info({ content: t('data.debug.copy_sentry_ids.empty') });
      return;
    }
    try {
      await navigator.clipboard.writeText(eventIds.join('\n'));
      alert.info({ content: t('data.debug.copy_sentry_ids.copy_events_success', { count: eventIds.length }) });
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
      classNames={{
        content: 'min-w-0 md:min-w-80 justify-end',
      }}
    >
      <div className="flex w-full flex-col items-stretch gap-2">
        <div className="rounded-sm border border-white/15 bg-black/15 px-3 py-2 text-xs text-zinc-200">
          <div className="flex items-center justify-between gap-3">
            <span className="shrink-0 text-zinc-400">{t('data.debug.copy_sentry_ids.device_id_label')}</span>
            <span className="truncate font-mono text-[11px] text-zinc-100">{deviceId}</span>
          </div>
          <div className="mt-2 text-zinc-400">{t('data.debug.copy_sentry_ids.event_count', { count: eventCount })}</div>
          {recentEventIds.length > 0 && (
            <div className="mt-2 space-y-1">
              {recentEventIds.map((eventId) => (
                <div key={eventId} className="truncate font-mono text-[11px] text-zinc-300">
                  {eventId}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <EndfieldFormButton onClick={handleCopyDeviceId} variant="primary">
            {t('data.debug.copy_sentry_ids.copy_device')}
          </EndfieldFormButton>
          <EndfieldFormButton onClick={handleCopyAllEventIds} variant="default">
            {t('data.debug.copy_sentry_ids.copy_events')}
          </EndfieldFormButton>
        </div>
      </div>
    </SettingItem>
  );
});
