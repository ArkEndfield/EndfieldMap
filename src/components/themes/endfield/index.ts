import { lazy } from 'react';

import { ComponentType, type ThemedComponentsMap } from '@/components/themes/types';

const Popup = lazy(() => import('@themes/endfield/popup'));
const ZoomController = lazy(() => import('@themes/endfield/zoom_controller'));
const Menus = lazy(() => import('@themes/endfield/menus'));
const ControlPanel = lazy(() => import('@themes/endfield/control_panel'));

const endfieldTheme: ThemedComponentsMap = new Map([
  [ComponentType.POPUP, Popup],
  [ComponentType.CONTROL_PANEL, ControlPanel],
  [ComponentType.ZOOM_CONTROLLER, ZoomController],
  [ComponentType.MENUS, Menus],
]);

export default endfieldTheme;
