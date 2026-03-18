import { LocalStorageDB } from '@endfieldmap/tools';
import { makeAutoObservable } from 'mobx';

/** Max number of Sentry event IDs to keep for user support/debugging. */
const MAX_STORED_EVENT_IDS = 100;

/** 设备 ID 存储键 */
const DEVICE_ID_STORAGE_KEY = 'sentry_device_id';
const SENTRY_EVENT_IDS_STORAGE_KEY = 'sentry_event_ids';

function loadStoredSentryEventIds(): string[] {
  const storedIds = LocalStorageDB.getItem<string[]>(SENTRY_EVENT_IDS_STORAGE_KEY);
  if (!Array.isArray(storedIds)) {
    return [];
  }
  return storedIds.filter((id): id is string => typeof id === 'string' && id.length > 0).slice(-MAX_STORED_EVENT_IDS);
}

/**
 * 生成一个新的设备 ID
 */
function generateDeviceId(): string {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  const timestamp = Date.now().toString(16);
  const randomStr = Math.random().toString(16).slice(2, 14).padEnd(12, '0');
  return `${timestamp}-${randomStr}`;
}

class SentryDiagnosticsStore {
  public deviceId = '';
  public eventIds: string[] = [];
  private loaded = false;

  public constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private persistStoredSentryEventIds(): void {
    LocalStorageDB.setItem(SENTRY_EVENT_IDS_STORAGE_KEY, [...this.eventIds]);
  }

  public ensureLoaded(): void {
    if (this.loaded) {
      return;
    }

    let deviceId = LocalStorageDB.getItem<string>(DEVICE_ID_STORAGE_KEY);
    if (!deviceId) {
      deviceId = generateDeviceId();
      LocalStorageDB.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }

    this.deviceId = deviceId;
    this.eventIds = loadStoredSentryEventIds();
    this.loaded = true;
  }

  public getDeviceId(): string {
    this.ensureLoaded();
    return this.deviceId;
  }

  public getStoredSentryEventIds(): readonly string[] {
    this.ensureLoaded();
    return [...this.eventIds];
  }

  public getRecentSentryEventIds(limit = 5): readonly string[] {
    this.ensureLoaded();
    return this.eventIds.slice(-Math.max(limit, 0)).reverse();
  }

  public getLastSentryEventId(): string | undefined {
    this.ensureLoaded();
    return this.eventIds[this.eventIds.length - 1];
  }

  public clearStoredSentryEventIds(): void {
    this.ensureLoaded();
    this.eventIds = [];
    this.persistStoredSentryEventIds();
  }

  public storeSentryEventId(eventId: string | undefined): void {
    this.ensureLoaded();
    if (!eventId) {
      return;
    }

    const nextEventIds = [...this.eventIds, eventId];
    if (nextEventIds.length > MAX_STORED_EVENT_IDS) {
      nextEventIds.shift();
    }
    this.eventIds = nextEventIds;
    this.persistStoredSentryEventIds();
  }
}

export const sentryDiagnosticsStore = new SentryDiagnosticsStore();

export function getDeviceId(): string {
  return sentryDiagnosticsStore.getDeviceId();
}

export function getStoredSentryEventIds(): readonly string[] {
  return sentryDiagnosticsStore.getStoredSentryEventIds();
}

export function getRecentSentryEventIds(limit = 5): readonly string[] {
  return sentryDiagnosticsStore.getRecentSentryEventIds(limit);
}

export function getLastSentryEventId(): string | undefined {
  return sentryDiagnosticsStore.getLastSentryEventId();
}

export function clearStoredSentryEventIds(): void {
  sentryDiagnosticsStore.clearStoredSentryEventIds();
}
