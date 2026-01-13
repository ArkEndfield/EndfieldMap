import type { PromptInputProps, ZmdAlertFullProps, ZmdAlertProps } from '@themes/types/alert';
import type { ThemeRootContextProps } from '@themes/types/context';
import type { TooltipProps } from '@themes/types/tooltip';
import type { FC, LazyExoticComponent } from 'react';

export enum ComponentType {
  POPUP = 'Popup',
  OPERATION_TIP = 'OperationTip',
  CONTROL_PANEL = 'ControlPanel',
  ZOOM_CONTROLLER = 'ZoonController',
  MENUS = 'Menus',
  ALERT = 'Alert',
  ALERT_FULL = 'AlertFull',
  ALERT_PROMPT_INPUT = 'AlertPromptInput',
  TOOLTIP = 'Tooltip',
  ROOT_PROVIDER = 'RootProvider',
}

export interface ThemedComponentMap {
  [ComponentType.POPUP]: LazyExoticComponent<FC<object>>;
  [ComponentType.OPERATION_TIP]: LazyExoticComponent<FC<object>>;
  [ComponentType.CONTROL_PANEL]: LazyExoticComponent<FC<object>>;
  [ComponentType.MENUS]: LazyExoticComponent<FC<object>>;
  [ComponentType.ZOOM_CONTROLLER]: LazyExoticComponent<FC<object>>;
  [ComponentType.ALERT]: LazyExoticComponent<FC<ZmdAlertProps>>;
  [ComponentType.ALERT_FULL]: LazyExoticComponent<FC<ZmdAlertFullProps>>;
  [ComponentType.ALERT_PROMPT_INPUT]: LazyExoticComponent<FC<PromptInputProps>>;
  [ComponentType.TOOLTIP]: LazyExoticComponent<
    <T extends React.ElementType>(props: TooltipProps<T>) => React.ReactElement | null
  >;
  [ComponentType.ROOT_PROVIDER]: LazyExoticComponent<FC<ThemeRootContextProps>>;
}

export type ThemedComponent<T extends ComponentType> = T extends keyof ThemedComponentMap
  ? ThemedComponentMap[T]
  : never;
