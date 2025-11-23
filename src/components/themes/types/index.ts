import type { PopupProps } from './popup';
import type { ControlPanelProps } from './control_panel';
import type { LazyExoticComponent } from 'react';
import type { ZoomControllerProps } from './zoom_controller';
import type { MenusProps } from './menus';

export enum ComponentType {
  POPUP = 'Popup',
  CONTROL_PANEL = 'ControlPanel',
  ELECTRIC_POLE_PRESET_PANEL = 'ElectricPolePresetPanel',
  ZOOM_CONTROLLER = 'ZoonController',
  MENUS = 'Menus',
}

export interface ThemedComponentProps {
  [ComponentType.POPUP]: PopupProps;
  [ComponentType.CONTROL_PANEL]: ControlPanelProps;
  [ComponentType.MENUS]: MenusProps,
  [ComponentType.ZOOM_CONTROLLER]: ZoomControllerProps;
}

export type ThemedComponentsMap = Map<
  ComponentType,
  LazyExoticComponent<React.FC<ThemedComponentProps[keyof ThemedComponentProps]>>
>;
