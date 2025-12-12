import { lazy } from 'react';

import { ComponentType, type ThemedComponentMap } from '@/components/themes/types';

const Popup = lazy(() => import('@themes/blur/popup'));
const ZoomController = lazy(() => import('@themes/blur/zoom_controller'));
const Menus = lazy(() => import('@themes/blur/menus'));
const ControlPanel = lazy(() => import('@themes/blur/control_panel'));
const Alert = lazy(() => import('@themes/blur/components/alert/alert'));
const AlertFull = lazy(() => import('@themes/blur/components/alert/alert_full'));
const AlertPromptInput = lazy(() => import('@themes/blur/components/alert/input'));
const Tooltip = lazy(() => import('@themes/blur/tooltip/tooltip'));

const blurTheme: ThemedComponentMap = {
  [ComponentType.POPUP]: Popup,
  [ComponentType.CONTROL_PANEL]: ControlPanel,
  [ComponentType.ZOOM_CONTROLLER]: ZoomController,
  [ComponentType.MENUS]: Menus,
  [ComponentType.ALERT]: Alert,
  [ComponentType.ALERT_FULL]: AlertFull,
  [ComponentType.ALERT_PROMPT_INPUT]: AlertPromptInput,
  [ComponentType.TOOLTIP]: Tooltip,
};

export default blurTheme;
