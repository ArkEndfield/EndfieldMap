import { alertStore } from './alert-store';
import type { NativeAlertConfig, NativePromptConfig } from './types';

export const alertApi = {
  show: (config: NativeAlertConfig) => alertStore.show(config),
  confirm: (config: NativeAlertConfig) => alertStore.confirm(config),
  info: (config: NativeAlertConfig | string) => alertStore.info(config),
  prompt: (config: NativePromptConfig | string) => alertStore.prompt(config),
  destroyAll: () => alertStore.destroyAll(),
};
