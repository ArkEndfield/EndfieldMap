import type { PopupProps } from "./popup";
import type { EntityPanelProps } from "./entity_panel";
import type { LazyExoticComponent } from "react";

export enum ComponentType {
    POPUP = 'Popup',
    ENTITY_PANEL = 'EntityPanel',
    ELECTRIC_POLE_PRESET_PANEL = 'ElectricPolePresetPanel',
}

export interface ThemedComponentProps {
    [ComponentType.POPUP]: PopupProps;
    [ComponentType.ENTITY_PANEL]: EntityPanelProps;
    // 电线杆预设管理面板，目前仅需要 adapter
    [ComponentType.ELECTRIC_POLE_PRESET_PANEL]: EntityPanelProps;
}

export type ThemedComponentsMap = Map<ComponentType, LazyExoticComponent<React.FC<ThemedComponentProps[keyof ThemedComponentProps]>>>;