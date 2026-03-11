import { SERVICE_EVENT, serviceEmitter } from '@endfieldmap/map-service';

import { alertApi } from '@/components/ui/alert';

let initialized = false;

/**
 * Bridges `serviceEmitter` events from `@endfieldmap/map-service` to concrete
 * UI implementations in `map-native` (alert dialogs, etc.).
 *
 * Call once during application bootstrap, before any service fires events.
 */
export function initServiceEventBridge(): void {
  if (initialized) return;
  initialized = true;
  serviceEmitter.on(SERVICE_EVENT.ALERT_INFO, (data) => {
    const content = typeof data === 'string' ? data : data.content;
    alertApi.info(content);
  });

  serviceEmitter.on(SERVICE_EVENT.ALERT_CONFIRM, (data) => {
    alertApi.confirm({
      content: data.content,
      dismissible: data.dismissible,
      confirmText: data.confirmText,
      cancelText: data.cancelText,
      onConfirm: data.onConfirm,
      onCancel: data.onCancel,
    });
  });

  serviceEmitter.on(SERVICE_EVENT.ALERT_PROMPT, (data) => {
    alertApi.prompt({
      content: data.content,
      defaultValue: data.defaultValue,
      placeholder: data.placeholder,
      onConfirm: data.onConfirm,
      onCancel: data.onCancel,
    });
  });

  serviceEmitter.on(SERVICE_EVENT.ALERT_SHOW, (data) => {
    alertApi.show({
      content: data.content,
      hideCancel: data.hideCancel,
      confirmText: data.confirmText,
      cancelText: data.cancelText,
      onCancel: data.onCancel,
    });
  });
}
