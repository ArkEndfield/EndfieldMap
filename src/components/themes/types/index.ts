import type { FC, LazyExoticComponent } from 'react';

import type { PromptInputProps, ZmdAlertFullProps, ZmdAlertProps } from '@/components/common/alert/types';

export enum ComponentType {
  POPUP = 'Popup',
  CONTROL_PANEL = 'ControlPanel',
  ELECTRIC_POLE_PRESET_PANEL = 'ElectricPolePresetPanel',
  ZOOM_CONTROLLER = 'ZoonController',
  MENUS = 'Menus',
  ALERT = 'Alert',
  ALERT_FULL = 'AlertFull',
  ALERT_PROMPT_INPUT = 'AlertPromptInput',
}

export interface ThemedComponentProps {
  [ComponentType.POPUP]: object;
  [ComponentType.CONTROL_PANEL]: object;
  [ComponentType.MENUS]: object;
  [ComponentType.ZOOM_CONTROLLER]: object;
  [ComponentType.ALERT]: ZmdAlertProps;
  [ComponentType.ALERT_FULL]: ZmdAlertFullProps;
  [ComponentType.ALERT_PROMPT_INPUT]: PromptInputProps;
}

export type ThemedComponentsMap = Map<
  ComponentType,
  LazyExoticComponent<FC<ThemedComponentProps[keyof ThemedComponentProps]>>
>;

export type ThemedComponent<T extends ComponentType> = T extends keyof ThemedComponentProps
  ? LazyExoticComponent<FC<ThemedComponentProps[T]>>
  : never;
