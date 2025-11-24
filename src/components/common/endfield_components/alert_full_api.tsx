import { type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ZmdAlertFull, type ZmdAlertFullProps } from './alert_full';

interface AlertFullInstance {
  destroy: () => void;
  update: (props: Partial<AlertFullConfig>) => void;
}

interface AlertFullConfig extends Omit<ZmdAlertFullProps, 'open' | 'onOpenChange'> {
  content?: ReactNode;
}

class AlertFullManager {
  private container: HTMLDivElement | null = null;
  private root: Root | null = null;
  private instances: Map<string, { destroy: () => void; update: (props: Partial<AlertFullConfig>) => void }> =
    new Map();

  private getContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'zmd-alert-full-container';
      document.body.appendChild(this.container);
      this.root = createRoot(this.container);
    }
    return { container: this.container, root: this.root! };
  }

  private createAlert(config: AlertFullConfig): AlertFullInstance {
    const id = `alert-full-${Date.now()}-${Math.random()}`;
    const { root } = this.getContainer();

    let currentOpen = true;
    let currentConfig = { ...config };

    const render = (open: boolean, props: AlertFullConfig) => {
      root.render(
        <ZmdAlertFull
          {...props}
          open={open}
          onOpenChange={(newOpen) => {
            currentOpen = newOpen;
            if (!newOpen) {
              // Wait for animation to complete (300ms = ~18 frames at 60fps)
              let frames = 0;
              const waitForAnimation = () => {
                frames++;
                if (frames < 18) {
                  requestAnimationFrame(waitForAnimation);
                } else {
                  instance.destroy();
                }
              };
              requestAnimationFrame(waitForAnimation);
            }
          }}
        >
          {props.content || props.children}
        </ZmdAlertFull>
      );
    };

    const instance: AlertFullInstance = {
      destroy: () => {
        this.instances.delete(id);
        if (this.instances.size === 0 && this.container) {
          // Wait for animation to complete before cleanup
          let frames = 0;
          const waitForCleanup = () => {
            frames++;
            if (frames < 18) {
              requestAnimationFrame(waitForCleanup);
            } else if (this.instances.size === 0) {
              this.root?.unmount();
              this.container?.remove();
              this.container = null;
              this.root = null;
            }
          };
          requestAnimationFrame(waitForCleanup);
        }
      },
      update: (props: Partial<AlertFullConfig>) => {
        currentConfig = { ...currentConfig, ...props };
        render(currentOpen, currentConfig);
      },
    };

    this.instances.set(id, instance);
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
