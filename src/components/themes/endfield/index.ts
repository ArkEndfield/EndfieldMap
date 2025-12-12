import { lazy } from 'react';

import { ComponentType, type ThemedComponentMap } from '@/components/themes/types';

const Popup = lazy(() => import('@themes/endfield/popup'));
const ZoomController = lazy(() => import('@themes/endfield/zoom_controller'));
const Menus = lazy(() => import('@themes/endfield/menus'));
const ControlPanel = lazy(() => import('@themes/endfield/control_panel'));
const Alert = lazy(() => import('@themes/endfield/components/alert/alert'));
const AlertFull = lazy(() => import('@themes/endfield/components/alert/alert_full'));
const AlertPromptInput = lazy(() => import('@themes/endfield/components/alert/input'));
const Tooltip = lazy(() => import('@themes/endfield/tooltip/tooltip'));

const endfieldTheme: ThemedComponentMap = {
  [ComponentType.POPUP]: Popup,
  [ComponentType.CONTROL_PANEL]: ControlPanel,
  [ComponentType.ZOOM_CONTROLLER]: ZoomController,
  [ComponentType.MENUS]: Menus,
  [ComponentType.ALERT]: Alert,
  [ComponentType.ALERT_FULL]: AlertFull,
  [ComponentType.ALERT_PROMPT_INPUT]: AlertPromptInput,
  [ComponentType.TOOLTIP]: Tooltip,
};

export default endfieldTheme;
