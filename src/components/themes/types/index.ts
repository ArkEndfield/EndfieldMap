import type { LazyExoticComponent } from 'react';

export enum ComponentType {
  POPUP = 'Popup',
  CONTROL_PANEL = 'ControlPanel',
  ELECTRIC_POLE_PRESET_PANEL = 'ElectricPolePresetPanel',
  ZOOM_CONTROLLER = 'ZoonController',
  MENUS = 'Menus',
}

export interface ThemedComponentProps {
  [ComponentType.POPUP]: object;
  [ComponentType.CONTROL_PANEL]: object;
  [ComponentType.MENUS]: object;
  [ComponentType.ZOOM_CONTROLLER]: object;
}

export type ThemedComponentsMap = Map<
  ComponentType,
  LazyExoticComponent<React.FC<ThemedComponentProps[keyof ThemedComponentProps]>>
>;

export type ThemedComponent<T extends ComponentType> = T extends keyof ThemedComponentProps
  ? LazyExoticComponent<React.FC<ThemedComponentProps[T]>>
  : never;
