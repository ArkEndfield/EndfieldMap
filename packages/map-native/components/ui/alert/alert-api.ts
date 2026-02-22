import { alertStore } from './alert-store';
import type { NativeAlertConfig } from './types';

export const alertApi = {
  show: (config: NativeAlertConfig) => alertStore.show(config),
  confirm: (config: NativeAlertConfig) => alertStore.confirm(config),
  info: (config: NativeAlertConfig | string) => alertStore.info(config),
  destroyAll: () => alertStore.destroyAll(),
};
