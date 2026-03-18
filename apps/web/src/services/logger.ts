import { getVersionInfo, logger } from '@endfieldmap/tools';
import * as Sentry from '@sentry/react';

import { isDev, sentryDsn } from '@/services/env';
import { getDeviceId, sentryDiagnosticsStore } from '@/services/sentry_diagnostics';

const versionInfo = getVersionInfo();

if (!isDev) {
  Sentry.init({
    dsn: sentryDsn,
    enableLogs: true,
    sendDefaultPii: true,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      sentryDiagnosticsStore.storeSentryEventId(event.event_id);

      // 添加设备 ID 到事件用户信息中，帮助开发者识别问题发生的具体设备
      const deviceId = getDeviceId();
      event.user = {
        ...event.user,
        id: deviceId,
      };

      // 添加版本信息到事件上下文
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
}

export const sentryReporter = isDev ? undefined : Sentry.createConsolaReporter();

if (sentryReporter) {
  logger.addReporter(sentryReporter);
}
