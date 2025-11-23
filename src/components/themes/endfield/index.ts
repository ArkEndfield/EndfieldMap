import { lazy } from 'react';
import { ComponentType, type ThemedComponentsMap } from '@/components/themes/types';

const Popup = lazy(() => import('./popup'));
const EntityPanel = lazy(() => import('./EntityPanel'));
const ZoomController = lazy(() => import('./zoom_controller'));
const Menus = lazy(() => import('./menus'));
const ElectricPolePresetPanel = lazy(() => import('./ElectricPolePresetPanel'));

const endfieldTheme: ThemedComponentsMap = new Map([
  [ComponentType.POPUP, Popup],
  [ComponentType.ENTITY_PANEL, EntityPanel],
  [ComponentType.ZOOM_CONTROLLER, ZoomController],
  [ComponentType.MENUS, Menus],
  [ComponentType.ELECTRIC_POLE_PRESET_PANEL, ElectricPolePresetPanel],
]);

export default endfieldTheme;
