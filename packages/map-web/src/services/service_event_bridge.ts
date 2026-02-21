import { SERVICE_EVENT,serviceEmitter } from '@endfieldmap/map-service';

import { alert } from '@/components/common/alert/alert_api';
import type { LoadingStageId } from '@/const/loading';
import { loadingManager } from '@/services/loading';

/**
 * Bridges `serviceEmitter` events from `@endfieldmap/map-service` to concrete
 * UI implementations in `map-web` (alert dialogs, loading progress, etc.).
 *
 * Call once during application bootstrap, before any service fires events.
 */
export function initServiceEventBridge(): void {
  serviceEmitter.on(SERVICE_EVENT.ALERT_INFO, (data) => {
    const content = typeof data === 'string' ? data : data.content;
    alert.info(content);
  });

  serviceEmitter.on(SERVICE_EVENT.ALERT_CONFIRM, (data) => {
    alert.confirm({
      content: data.content,
      dismissible: data.dismissible,
      onConfirm: data.onConfirm,
      onCancel: data.onCancel,
    });
  });

  serviceEmitter.on(SERVICE_EVENT.ALERT_SHOW, (data) => {
    alert.show({
      content: data.content,
      hideCancel: data.hideCancel,
      onCancel: data.onCancel,
    });
  });

  serviceEmitter.on(SERVICE_EVENT.LOADING_PROGRESS, (data) => {
    loadingManager.updateStageProgress(data.stageId as LoadingStageId, data.progress);
  });

  serviceEmitter.on(SERVICE_EVENT.LOADING_COMPLETE, (data) => {
    loadingManager.completeStage(data.stageId as LoadingStageId);
  });

  serviceEmitter.on(SERVICE_EVENT.LOADING_ERROR, (data) => {
    loadingManager.setError(data.error);
  });
}
