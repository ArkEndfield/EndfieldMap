import { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';

export const SERVICE_EVENT = {
  ALERT_INFO: 'service:alert:info',
  ALERT_CONFIRM: 'service:alert:confirm',
  ALERT_SHOW: 'service:alert:show',
  LOADING_PROGRESS: 'service:loading:progress',
  LOADING_COMPLETE: 'service:loading:complete',
  LOADING_ERROR: 'service:loading:error',
} as const;

export type ServiceEventMap = {
  [SERVICE_EVENT.ALERT_INFO]: string | { content: string };
  [SERVICE_EVENT.ALERT_CONFIRM]: {
    content: string;
    dismissible?: boolean;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
  };
  [SERVICE_EVENT.ALERT_SHOW]: {
    content: string;
    hideCancel?: boolean;
    onCancel?: () => void | Promise<void>;
  };
  [SERVICE_EVENT.LOADING_PROGRESS]: { stageId: string; progress: number };
  [SERVICE_EVENT.LOADING_COMPLETE]: { stageId: string };
  [SERVICE_EVENT.LOADING_ERROR]: { error: Error };
};

export const serviceEmitter = new EndfieldMapEmitter<ServiceEventMap>();
