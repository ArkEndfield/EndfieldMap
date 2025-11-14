import { logger } from '@endfieldmap/tools';
import * as Sentry from '@sentry/react';

import { isDev } from '@/services/env';

Sentry.init({
    dsn: "https://d1e71088df3b60bff2a3486d98218f52@o4510343931559936.ingest.us.sentry.io/4510343933067264",
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
