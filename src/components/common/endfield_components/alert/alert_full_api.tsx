import { type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { ZmdAlertFull, type ZmdAlertFullProps } from '@/components/common/endfield_components/alert/alert_full';

interface AlertFullInstance {
  destroy: () => void;
  update: (props: Partial<AlertFullConfig>) => void;
}

interface AlertFullConfig extends Omit<ZmdAlertFullProps, 'open' | 'onOpenChange'> {
  content?: ReactNode;
}

class AlertFullManager {
  private instances: Map<
    string,
    {
      destroy: () => void;
      update: (props: Partial<AlertFullConfig>) => void;
      container: HTMLDivElement;
      root: Root;
    }
  > = new Map();

  private createAlert(config: AlertFullConfig): AlertFullInstance {
    const id = `alert-full-${Date.now()}-${Math.random()}`;
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

    const render = (open: boolean, props: AlertFullConfig) => {
      root.render(
        <ZmdAlertFull
          {...props}
          open={open}
          onOpenChange={(newOpen) => {
            if (!newOpen && currentOpen && !isDestroying) {
              currentOpen = false;
              isDestroying = true;
              // Trigger close animation
              render(false, currentConfig);
              // Wait for animation to complete before cleanup
              setTimeout(() => {
                cleanup();
              }, 150);
            }
          }}
        >
          {props.content || props.children}
        </ZmdAlertFull>
      );
    };

    const instance: AlertFullInstance = {
      destroy: () => {
        if (isDestroying || !currentOpen) return;
        currentOpen = false;
        isDestroying = true;
        // Trigger close animation by setting open to false
        render(false, currentConfig);
      },
      update: (props: Partial<AlertFullConfig>) => {
        currentConfig = { ...currentConfig, ...props };
        render(currentOpen, currentConfig);
      },
    };

    this.instances.set(id, { ...instance, container, root });
    render(true, currentConfig);

    return instance;
  }

  show(config: AlertFullConfig): AlertFullInstance {
    return this.createAlert(config);
  }

  confirm(config: AlertFullConfig): Promise<boolean> {
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

  info(config: Omit<AlertFullConfig, 'hideCancel'>): AlertFullInstance {
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

export const alertFull = new AlertFullManager();
