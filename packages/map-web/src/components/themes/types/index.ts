import type { ZmdAlertFullProps, ZmdAlertProps } from '@themes/types/alert';
import type { InputProps } from '@themes/types/input';
import type { ThemeRootContextProps } from '@themes/types/context';
import type { TooltipProps } from '@themes/types/tooltip';
import type { FC, LazyExoticComponent } from 'react';

export enum ComponentType {
  POPUP = 'Popup',
  OPERATION_TIP = 'OperationTip',
  CONTROL_PANEL = 'ControlPanel',
  ZOOM_CONTROLLER = 'ZoonController',
  MAP_INDEX_MENU = 'MapIndexMenu',
  MENUS = 'Menus',
  ALERT = 'Alert',
  ALERT_FULL = 'AlertFull',
  INPUT = 'Input',
  TOOLTIP = 'Tooltip',
  ROOT_PROVIDER = 'RootProvider',
  TIER_MANAGER = 'TierManager',
  EXTRA_OPERATION = 'ExtraOperation',
}

export interface ThemedComponentMap {
  [ComponentType.POPUP]: LazyExoticComponent<FC<object>>;
  [ComponentType.OPERATION_TIP]: LazyExoticComponent<FC<object>>;
  [ComponentType.CONTROL_PANEL]: LazyExoticComponent<FC<object>>;
  [ComponentType.MAP_INDEX_MENU]: LazyExoticComponent<FC<object>>;
  [ComponentType.MENUS]: LazyExoticComponent<FC<object>>;
  [ComponentType.ZOOM_CONTROLLER]: LazyExoticComponent<FC<object>>;
  [ComponentType.ALERT]: LazyExoticComponent<FC<ZmdAlertProps>>;
  [ComponentType.ALERT_FULL]: LazyExoticComponent<FC<ZmdAlertFullProps>>;
  [ComponentType.INPUT]: LazyExoticComponent<FC<InputProps>>;
  [ComponentType.TOOLTIP]: LazyExoticComponent<
    <T extends React.ElementType>(props: TooltipProps<T>) => React.ReactElement | null
  >;
  [ComponentType.ROOT_PROVIDER]: LazyExoticComponent<FC<ThemeRootContextProps>>;
  [ComponentType.TIER_MANAGER]: LazyExoticComponent<FC<object>>;
  [ComponentType.EXTRA_OPERATION]: LazyExoticComponent<FC<object>>;
}

export type ThemedComponent<T extends ComponentType> = T extends keyof ThemedComponentMap
  ? ThemedComponentMap[T]
  : never;
