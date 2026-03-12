import { logger } from '@endfieldmap/tools';
import * as Sentry from '@sentry/react';

import { isDev, sentryDsn } from '@/services/env';

/** Max number of Sentry event IDs to keep in memory (for user to copy when reporting issues). */
const MAX_STORED_EVENT_IDS = 100;

const storedSentryEventIds: string[] = [];

export function getStoredSentryEventIds(): readonly string[] {
  return [...storedSentryEventIds];
}

export function getLastSentryEventId(): string | undefined {
  return storedSentryEventIds[storedSentryEventIds.length - 1];
}

export function clearStoredSentryEventIds(): void {
  storedSentryEventIds.length = 0;
}

function storeSentryEventId(eventId: string | undefined): void {
  if (eventId) {
    storedSentryEventIds.push(eventId);
    if (storedSentryEventIds.length > MAX_STORED_EVENT_IDS) {
      storedSentryEventIds.shift();
    }
  }
}

if (!isDev) {
  Sentry.init({
    dsn: sentryDsn,
    enableLogs: true,
    sendDefaultPii: true,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      storeSentryEventId(event.event_id);
      return event;
    },
  });
}

export const sentryReporter = isDev ? undefined : Sentry.createConsolaReporter();

if (sentryReporter) {
  logger.addReporter(sentryReporter);
}
