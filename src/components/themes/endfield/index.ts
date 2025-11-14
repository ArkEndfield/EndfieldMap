import { lazy } from "react";
import { ComponentType, type ThemedComponentsMap } from "@/components/themes/types";

const Popup = lazy(() => import("./Popup"));
const EntityPanel = lazy(() => import("./EntityPanel"));

const endfieldTheme: ThemedComponentsMap = new Map([
    [ComponentType.POPUP, Popup],
    [ComponentType.ENTITY_PANEL, EntityPanel],
]);

export default endfieldTheme;