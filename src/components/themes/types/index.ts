import type { FC, LazyExoticComponent } from 'react';

import type { PromptInputProps, ZmdAlertFullProps, ZmdAlertProps } from '@themes/types/alert';

export enum ComponentType {
  POPUP = 'Popup',
  CONTROL_PANEL = 'ControlPanel',
  ZOOM_CONTROLLER = 'ZoonController',
  MENUS = 'Menus',
  ALERT = 'Alert',
  ALERT_FULL = 'AlertFull',
  ALERT_PROMPT_INPUT = 'AlertPromptInput',
}

export interface ThemedComponentMap {
  [ComponentType.POPUP]: LazyExoticComponent<FC<object>>;
  [ComponentType.CONTROL_PANEL]: LazyExoticComponent<FC<object>>;
  [ComponentType.MENUS]: LazyExoticComponent<FC<object>>;
  [ComponentType.ZOOM_CONTROLLER]: LazyExoticComponent<FC<object>>;
  [ComponentType.ALERT]: LazyExoticComponent<FC<ZmdAlertProps>>;
  [ComponentType.ALERT_FULL]: LazyExoticComponent<FC<ZmdAlertFullProps>>;
  [ComponentType.ALERT_PROMPT_INPUT]: LazyExoticComponent<FC<PromptInputProps>>;
}

export type ThemedComponent<T extends ComponentType> = T extends keyof ThemedComponentMap
  ? ThemedComponentMap[T]
  : never;
