import { type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ZmdAlert, type ZmdAlertProps } from './alert';

interface AlertInstance {
  destroy: () => void;
  update: (props: Partial<AlertConfig>) => void;
}

interface AlertConfig extends Omit<ZmdAlertProps, 'open' | 'onOpenChange'> {
  content?: ReactNode;
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

  info(config: Omit<AlertConfig, 'hideCancel'>): AlertInstance {
    return this.createAlert({
      ...config,
      hideCancel: true,
    });
  }

  destroyAll() {
    this.instances.forEach((instance) => instance.destroy());
    this.instances.clear();
  }
}

export const alert = new AlertManager();
