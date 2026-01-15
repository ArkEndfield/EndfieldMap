import { ComponentType, type ThemedComponentMap } from '@themes/types';
import { lazy } from 'react';

const Popup = lazy(() => import('@themes/endfield/ui/popup'));
const OperationTip = lazy(() => import('@themes/endfield/ui/operation_tip'));
const ZoomController = lazy(() => import('@themes/endfield/ui/zoom_controller'));
const MapIndexMenu = lazy(() => import('@themes/endfield/ui/map_menu'));
const Menus = lazy(() => import('@themes/endfield/ui/menus'));
const ControlPanel = lazy(() => import('@themes/endfield/ui/control_panel'));
const Alert = lazy(() => import('@themes/endfield/components/alert/alert'));
const AlertFull = lazy(() => import('@themes/endfield/components/alert/alert_full'));
const AlertPromptInput = lazy(() => import('@themes/endfield/components/alert/input'));
const Tooltip = lazy(() => import('@themes/endfield/components/tooltip'));
const ThemeRootProvider = lazy(() => import('@themes/endfield/components/root_provider'));

const endfieldTheme: ThemedComponentMap = {
  [ComponentType.POPUP]: Popup,
  [ComponentType.OPERATION_TIP]: OperationTip,
  [ComponentType.CONTROL_PANEL]: ControlPanel,
  [ComponentType.ZOOM_CONTROLLER]: ZoomController,
  [ComponentType.MAP_INDEX_MENU]: MapIndexMenu,
  [ComponentType.MENUS]: Menus,
  [ComponentType.ALERT]: Alert,
  [ComponentType.ALERT_FULL]: AlertFull,
  [ComponentType.ALERT_PROMPT_INPUT]: AlertPromptInput,
  [ComponentType.TOOLTIP]: Tooltip,
  [ComponentType.ROOT_PROVIDER]: ThemeRootProvider,
};

export default endfieldTheme;
