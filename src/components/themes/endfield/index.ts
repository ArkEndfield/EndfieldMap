import { lazy } from "react";
import { ComponentType, type ThemedComponentsMap } from "@/components/themes/types";

const Popup = lazy(() => import("./Popup"));
const EntityPanel = lazy(() => import("./EntityPanel"));
const ElectricPolePresetPanel = lazy(() => import("./ElectricPolePresetPanel"));

const endfieldTheme: ThemedComponentsMap = new Map([
    [ComponentType.POPUP, Popup],
    [ComponentType.ENTITY_PANEL, EntityPanel],
    [ComponentType.ELECTRIC_POLE_PRESET_PANEL, ElectricPolePresetPanel],
]);

export default endfieldTheme;