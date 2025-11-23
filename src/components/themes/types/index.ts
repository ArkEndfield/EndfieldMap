import type { PopupProps } from './popup';
import type { EntityPanelProps } from './entity_panel';
import type { LazyExoticComponent } from 'react';
import type { ZoomControllerProps } from './zoom_controller';
import type { MenusProps } from './menus';

export enum ComponentType {
  POPUP = 'Popup',
  ENTITY_PANEL = 'EntityPanel',
  ELECTRIC_POLE_PRESET_PANEL = 'ElectricPolePresetPanel',
  ZOOM_CONTROLLER = 'ZoonController',
  MENUS = 'Menus',
}

export interface ThemedComponentProps {
  [ComponentType.POPUP]: PopupProps;
  [ComponentType.ENTITY_PANEL]: EntityPanelProps;
  [ComponentType.MENUS]: MenusProps,
  [ComponentType.ZOOM_CONTROLLER]: ZoomControllerProps;
  // 电线杆预设管理面板，目前仅需要 adapter
  [ComponentType.ELECTRIC_POLE_PRESET_PANEL]: EntityPanelProps;
}

export type ThemedComponentsMap = Map<
  ComponentType,
  LazyExoticComponent<React.FC<ThemedComponentProps[keyof ThemedComponentProps]>>
>;
