import { logger } from '@endfieldmap/tools';
import * as Sentry from '@sentry/react';

import { isDev, sentryDsn } from '@/services/env';

Sentry.init({
  dsn: sentryDsn,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  // sendDefaultPii: true,
  enableLogs: true,
  beforeSendLog: (log) => {
    if (isDev) {
      return null;
    }
    // if (log.level === "info") {
    //     Filter out all info logs
    //     return null;
    // }
    return log;
  },
});

export const sentryReporter = Sentry.createConsolaReporter();

logger.addReporter(sentryReporter);
