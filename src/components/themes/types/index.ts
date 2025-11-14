import type { PopupProps } from "./popup";
import type { EntityPanelProps } from "./entity_panel";
import type { LazyExoticComponent } from "react";

export enum ComponentType {
    POPUP = 'Popup',
    ENTITY_PANEL = 'EntityPanel',
}

export interface ThemedComponentProps {
    [ComponentType.POPUP]: PopupProps;
    [ComponentType.ENTITY_PANEL]: EntityPanelProps;
}

export type ThemedComponentsMap = Map<ComponentType, LazyExoticComponent<React.FC<ThemedComponentProps[keyof ThemedComponentProps]>>>;