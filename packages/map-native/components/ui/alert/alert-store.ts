import { action, makeObservable, observable } from 'mobx';

import type { AlertInstance, NativeAlertConfig, NativePromptConfig } from './types';

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

  prompt(config: NativePromptConfig | string): Promise<string | null> {
    return new Promise((resolve) => {
      const promptConfig: NativePromptConfig =
        typeof config === 'string' ? { content: config } : config;

      const id = `alert-${Date.now()}-${Math.random()}`;
      const instance: AlertInstance = {
        id,
        config: {
          ...promptConfig,
          onConfirm: async () => {
            // The actual input value will be injected by the alert component
            // via updatePromptValue before calling onConfirm
            const inputValue = this.promptValues.get(id) ?? promptConfig.defaultValue ?? '';
            const result = await promptConfig.onConfirm?.(inputValue);
            if (result !== false) {
              resolve(inputValue);
              this.promptValues.delete(id);
            }
            return result;
          },
          onCancel: async () => {
            const result = await promptConfig.onCancel?.();
            if (result !== false) {
              resolve(null);
              this.promptValues.delete(id);
            }
            return result;
          },
          onDismiss: async () => {
            const result = await promptConfig.onDismiss?.();
            if (result !== false) {
              resolve(null);
              this.promptValues.delete(id);
            }
            return result;
          },
        },
        visible: true,
        isPrompt: true,
        promptDefaultValue: promptConfig.defaultValue,
        promptPlaceholder: promptConfig.placeholder,
      };
      this.alerts.push(instance);
    });
  }

  promptValues: Map<string, string> = new Map();

  updatePromptValue(id: string, value: string) {
    this.promptValues.set(id, value);
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
