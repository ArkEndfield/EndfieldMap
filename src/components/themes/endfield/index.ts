import { lazy } from 'react';

import { ComponentType, type ThemedComponentsMap } from '@/components/themes/types';

const Popup = lazy(() => import('./popup'));
const ZoomController = lazy(() => import('./zoom_controller'));
const Menus = lazy(() => import('./menus'));
const ControlPanel = lazy(() => import('./control_panel'));

const endfieldTheme: ThemedComponentsMap = new Map([
  [ComponentType.POPUP, Popup],
  [ComponentType.CONTROL_PANEL, ControlPanel],
  [ComponentType.ZOOM_CONTROLLER, ZoomController],
  [ComponentType.MENUS, Menus],
]);

export default endfieldTheme;
