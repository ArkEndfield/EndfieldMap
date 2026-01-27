import { logger } from '@endfieldmap/tools';
import * as Sentry from '@sentry/react';

import { isDev, sentryDsn } from '@/services/env';

if (!isDev) {
  Sentry.init({
    dsn: sentryDsn,
    enableLogs: true,
    sendDefaultPii: true,
    integrations: [Sentry.replayIntegration()],
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

export const sentryReporter = isDev ? void 0 : Sentry.createConsolaReporter();

if (sentryReporter) {
  logger.addReporter(sentryReporter);
}
