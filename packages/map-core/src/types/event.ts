import type { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import type { MapFeature } from '@endfieldmap/map-core/render/features/feature';
import type { Feature, MapBrowserEvent } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { FeatureLike } from 'ol/Feature';
import type { Point } from 'ol/geom';
import type { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';

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

export interface FeatureSelectEventDetail {
    features: Feature<Point>[];
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
    property: 'marked' | 'isSelected' | 'active';
    oldValue: boolean;
    newValue: boolean;
}

export interface ActiveFeatureChangeEventDetail {
    oldFeature: MapFeature | null;
    newFeature: MapFeature | null;
}

export interface MapEventEmitter {
    // 基于 ol 的
    [MAP_EVENT.ZOOM_CHANGE]: number;
    [MAP_EVENT.MAP_CLICK]: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
    [MAP_EVENT.MAP_CENTER_CHANGE]: Coordinate | undefined;

    [MAP_EVENT.FEATURE_SELECT]: FeatureSelectEventDetail;
    [MAP_EVENT.FEATURE_STATE_CHANGE]: FeatureStateChangeEventDetail;

    // 高级封装的
    [MAP_EVENT.CLUSTER_CLICK]: ClusterEventDetail;
    [MAP_EVENT.ENTITY_CLICK]: EntityEventDetail;
    [MAP_EVENT.ENTITY_VISIBILITY_CHANGE]: EntityVisibilityChangeEventDetail;
    [MAP_EVENT.ACTIVE_FEATURE_CHANGE]: ActiveFeatureChangeEventDetail;
    [MAP_EVENT.SELECTION_START]: void;
}

export type MapEventListener<T extends keyof MapEventEmitter> = (event: MapEventEmitter[T]) => void;

export type MapEventListenerUnion = MapEventListener<keyof MapEventEmitter>;

export type DisposeListener = () => void;