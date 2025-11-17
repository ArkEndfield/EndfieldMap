import type { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import type { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { Feature, Map as OlMap, MapBrowserEvent } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { FeatureLike } from 'ol/Feature';
import type { Point } from 'ol/geom';
import type { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';
import type { ElectricPoleEntityLayer } from '@endfieldmap/map-core/render/layers/entity/electric_pole';
import type { ElectricPoleConnectionLayer } from '@endfieldmap/map-core/render/layers/electric_pole_connection';

export interface ClusterEventDetail {
    features: Feature<Point>[];
    instances: MapFeature[];
    coordinates: Coordinate[];
    extent: Extent;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
}

export interface EntityEventDetail {
    instance: MapFeature;
    feature: FeatureLike;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
}

export interface MapContextMenuEventDetail {
    pixel: [number, number];
    coordinate: Coordinate | undefined;
    originalEvent: MouseEvent;
    map: OlMap;
}

export interface EntityContextMenuEventDetail {
    instance: MapFeature;
    feature: FeatureLike;
    layer: CommonPointEntityLayer | ElectricPoleEntityLayer;
    event: MapContextMenuEventDetail;
}

export interface ConnectionContextMenuEventDetail {
    feature: FeatureLike;
    layer: ElectricPoleConnectionLayer;
    event: MapContextMenuEventDetail;
}

export interface FeatureSelectEventDetail {
    features: Feature<Point>[];
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
}

export interface MapHoverEventDetail {
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
}

export interface EntityVisibilityChangeEventDetail {
    batch: boolean;
    visible: boolean;
    layers: CommonPointEntityLayer[];
    changes: Array<{ layer: CommonPointEntityLayer; visible: boolean }>;
}

export interface FeatureStateChangeEventDetail {
    feature: MapFeature;
    property: 'marked' | 'isSelected' | 'active' | 'hovered';
    oldValue: boolean;
    newValue: boolean;
}

export interface ActiveFeatureChangeEventDetail {
    oldFeature: MapFeature | null;
    newFeature: MapFeature | null;
    coordinate: Coordinate | null;
}

export interface HoverFeatureChangeEventDetail {
    oldFeature: MapFeature | null;
    newFeature: MapFeature | null;
    coordinate: Coordinate | null;
}

export interface ElectricPoleChangedEventDetail {
  mapIndex: string | null;
}

export interface MapEventEmitter {
    // 基于 ol 的
    [MAP_EVENT.ZOOM_CHANGE]: number;
    [MAP_EVENT.MAP_CLICK]: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
    [MAP_EVENT.MAP_HOVER]: MapHoverEventDetail;
    [MAP_EVENT.MAP_CENTER_CHANGE]: Coordinate | undefined;
    [MAP_EVENT.MAP_CONTEXT_MENU]: MapContextMenuEventDetail;
    [MAP_EVENT.FEATURE_SELECT]: FeatureSelectEventDetail;
    [MAP_EVENT.FEATURE_STATE_CHANGE]: FeatureStateChangeEventDetail;

    // 高级封装的
    [MAP_EVENT.CLUSTER_CLICK]: ClusterEventDetail;
    [MAP_EVENT.ENTITY_CLICK]: EntityEventDetail;
    [MAP_EVENT.ENTITY_CONTEXT_MENU]: EntityContextMenuEventDetail;
    [MAP_EVENT.ENTITY_VISIBILITY_CHANGE]: EntityVisibilityChangeEventDetail;
    [MAP_EVENT.ACTIVE_FEATURE_CHANGE]: ActiveFeatureChangeEventDetail;
    [MAP_EVENT.HOVER_FEATURE_CHANGE]: HoverFeatureChangeEventDetail;
    [MAP_EVENT.SELECTION_START]: void;
    [MAP_EVENT.CONNECTION_CONTEXT_MENU]: ConnectionContextMenuEventDetail;
  [MAP_EVENT.ELECTRIC_POLE_CHANGED]: ElectricPoleChangedEventDetail;
}

export type MapEventListener<T extends keyof MapEventEmitter> = (event: MapEventEmitter[T]) => void;

export type MapEventListenerUnion = MapEventListener<keyof MapEventEmitter>;

export type DisposeListener = () => void;