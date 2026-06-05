import { getVersionInfo, logger } from '@endfieldmap/tools';

import { isDev, sentryDsn } from '@/services/env';
import { getDeviceId, sentryDiagnosticsStore } from '@/services/sentry_diagnostics';

const versionInfo = getVersionInfo();

if (!isDev) {
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      enableLogs: true,
      sendDefaultPii: true,
      integrations: [Sentry.replayIntegration()],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event) {
        sentryDiagnosticsStore.storeSentryEventId(event.event_id);
        event.user = { ...event.user, id: getDeviceId() };
        event.contexts = {
          ...event.contexts,
          app: {
            app_version: versionInfo.commitHash,
            build_time: versionInfo.buildTime,
          },
        };
        return event;
      },
    });
    logger.addReporter(Sentry.createConsolaReporter());
  });
}
