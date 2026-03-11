import type { LoggerReporter } from '@endfieldmap/tools';
import { logger } from '@endfieldmap/tools';
import * as Sentry from '@sentry/react';

import { isDev, sentryDsn } from '@/services/env';

/** Max number of Sentry event IDs to keep in memory. */
const MAX_STORED_EVENT_IDS = 100;

/** In-memory store of Sentry event IDs from submitted logs. */
const storedSentryEventIds: string[] = [];

/**
 * Returns a copy of stored Sentry event IDs (newest last).
 * Use after a log is submitted to Sentry to get the event ID for support/debugging.
 */
export function getStoredSentryEventIds(): readonly string[] {
  return [...storedSentryEventIds];
}

/**
 * Returns the most recently stored Sentry event ID, or undefined if none.
 */
export function getLastSentryEventId(): string | undefined {
  return storedSentryEventIds[storedSentryEventIds.length - 1];
}

/**
 * Clears the stored Sentry event IDs. Useful when you no longer need to retain them.
 */
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

function formatLogMessage(logObject: { message?: string; args?: unknown[] }): string {
  const { message, args = [] } = logObject;
  if (message && args.length === 0) return String(message);
  if (message && args.length > 0) return `${message} ${args.map((a) => String(a)).join(' ')}`.trim();
  return args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') || '';
}

type SentrySeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

function consolaLevelToSentrySeverity(level: number): SentrySeverityLevel {
  const map: Record<number, SentrySeverityLevel> = {
    1: 'fatal',
    2: 'error',
    3: 'warning',
    4: 'log',
    5: 'info',
    6: 'info',
    7: 'debug',
    8: 'debug',
  };
  return map[level] ?? 'log';
}

interface ConsolaLogObject {
  message?: string;
  args?: unknown[];
  level?: number;
}

function createSentryReporterWithIdStorage(): LoggerReporter {
  return {
    log(logObject: ConsolaLogObject) {
      const message = formatLogMessage(logObject);
      const level = logObject.level ?? 4;
      const severity = consolaLevelToSentrySeverity(level);

      let eventId: string | undefined;
      if (severity === 'error' || severity === 'fatal') {
        eventId = Sentry.captureException(new Error(message), { level: severity });
      } else {
        eventId = Sentry.captureMessage(message, severity);
      }
      storeSentryEventId(eventId);
    },
  };
}

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

export const sentryReporter: LoggerReporter | undefined = isDev ? undefined : createSentryReporterWithIdStorage();

if (sentryReporter) {
  logger.addReporter(sentryReporter);
}
