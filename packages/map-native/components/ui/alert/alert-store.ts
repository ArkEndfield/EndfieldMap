import { action, makeObservable, observable } from 'mobx';

import type { AlertInstance, NativeAlertConfig } from './types';

interface AlertHandle {
  destroy: () => void;
  update: (config: Partial<NativeAlertConfig>) => void;
}

class AlertStore {
  alerts: AlertInstance[] = [];

  constructor() {
    makeObservable(this, {
      alerts: observable,
      show: action,
      remove: action,
      destroyAll: action,
    });
  }

  show(config: NativeAlertConfig): AlertHandle {
    const id = `alert-${Date.now()}-${Math.random()}`;
    const instance: AlertInstance = { id, config, visible: true };
    this.alerts.push(instance);

    return {
      destroy: () => this.remove(id),
      update: (partial: Partial<NativeAlertConfig>) => {
        const alert = this.alerts.find((a) => a.id === id);
        if (alert) {
          alert.config = { ...alert.config, ...partial };
        }
      },
    };
  }

  confirm(config: NativeAlertConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.show({
        ...config,
        onConfirm: async () => {
          const result = await config.onConfirm?.();
          if (result !== false) {
            resolve(true);
          }
          return result;
        },
        onCancel: async () => {
          const result = await config.onCancel?.();
          if (result !== false) {
            resolve(false);
          }
          return result;
        },
        onDismiss: async () => {
          const result = await config.onDismiss?.();
          if (result !== false) {
            resolve(false);
          }
          return result;
        },
      });
    });
  }

  info(config: NativeAlertConfig | string): AlertHandle {
    const resolved: NativeAlertConfig =
      typeof config === 'string' ? { content: config } : config;
    return this.show({ ...resolved, hideCancel: true });
  }

  remove(id: string) {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.visible = false;
      setTimeout(
        action(() => {
          this.alerts = this.alerts.filter((a) => a.id !== id);
        }),
        250,
      );
    }
  }

  destroyAll() {
    this.alerts = [];
  }
}

export const alertStore = new AlertStore();
