import type { ZmdAlertProps } from '@themes/types/alert';
import { type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { ZmdAlert } from '@/components/common/alert/alert';
import { Input } from '@/components/common/input';

interface AlertInstance {
  destroy: () => void;
  update: (props: Partial<AlertConfig>) => void;
}

interface AlertConfig extends Omit<ZmdAlertProps, 'open' | 'onOpenChange'> {
  content?: ReactNode;
}

interface PromptConfig extends Omit<AlertConfig, 'content'> {
  content?: ReactNode;
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'password' | 'number' | 'email' | 'url' | 'tel';
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  inputClassName?: string;
}

class AlertManager {
  private instances: Map<
    string,
    { destroy: () => void; update: (props: Partial<AlertConfig>) => void; container: HTMLDivElement; root: Root }
  > = new Map();

  private createAlert(config: AlertConfig): AlertInstance {
    const id = `alert-${Date.now()}-${Math.random()}`;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    let currentOpen = true;
    let currentConfig = { ...config };
    let isDestroying = false;

    const cleanup = () => {
      const instanceData = this.instances.get(id);
      if (instanceData) {
        this.instances.delete(id);
        instanceData.root.unmount();
        instanceData.container.remove();
      }
    };

    const render = (open: boolean, props: AlertConfig) => {
      root.render(
        <ZmdAlert
          {...props}
          open={open}
          onOpenChange={(newOpen) => {
            if (!newOpen && currentOpen && !isDestroying) {
              currentOpen = false;
              isDestroying = true;
              // Trigger close animation
              render(false, currentConfig);
              setTimeout(() => {
                cleanup();
                // TODO: 等待动画
              }, 250);
            }
          }}
        >
          {props.content || props.children}
        </ZmdAlert>
      );
    };

    const instance: AlertInstance = {
      destroy: () => {
        if (isDestroying || !currentOpen) return;
        currentOpen = false;
        isDestroying = true;
        // Trigger close animation by setting open to false
        render(false, currentConfig);
      },
      update: (props: Partial<AlertConfig>) => {
        currentConfig = { ...currentConfig, ...props };
        render(currentOpen, currentConfig);
      },
    };

    this.instances.set(id, { ...instance, container, root });
    render(true, currentConfig);

    return instance;
  }

  show(config: AlertConfig): AlertInstance {
    return this.createAlert(config);
  }

  confirm(config: AlertConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.createAlert({
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
        onClose: async () => {
          const result = await config.onClose?.();
          if (result !== false) {
            resolve(false);
          }
          return result;
        },
      });
    });
  }

  info(config: Omit<AlertConfig, 'hideCancel'> | string): AlertInstance {
    if (typeof config === 'string') {
      return this.createAlert({
        content: <div className="text-center">{config}</div>,
        hideCancel: true,
      });
    }
    return this.createAlert({
      ...config,
      hideCancel: true,
    });
  }

  prompt(config: PromptConfig | string): Promise<string | null> {
    return new Promise((resolve) => {
      let inputValue = typeof config === 'string' ? '' : (config.defaultValue ?? '');

      const promptConfig: PromptConfig = typeof config === 'string' ? { content: config } : config;

      this.createAlert({
        ...promptConfig,
        content: (
          <Input
            placeholder={promptConfig.placeholder}
            defaultValue={promptConfig.defaultValue}
            inputType={promptConfig.inputType}
            maxLength={promptConfig.maxLength}
            minLength={promptConfig.minLength}
            pattern={promptConfig.pattern}
            inputClassName={promptConfig.inputClassName}
            content={promptConfig.content}
            onValueChange={(value: string) => {
              inputValue = value;
            }}
          />
        ),
        onConfirm: async () => {
          if (promptConfig.required && !inputValue.trim()) {
            return false;
          }
          const result = await promptConfig.onConfirm?.();
          if (result !== false) {
            resolve(inputValue);
          }
          return result;
        },
        onCancel: async () => {
          const result = await promptConfig.onCancel?.();
          if (result !== false) {
            resolve(null);
          }
          return result;
        },
        onClose: async () => {
          const result = await promptConfig.onClose?.();
          if (result !== false) {
            resolve(null);
          }
          return result;
        },
      });
    });
  }

  destroyAll() {
    this.instances.forEach((instance) => instance.destroy());
    this.instances.clear();
  }
}

export const alert = new AlertManager();
