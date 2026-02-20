import type { ElectricPoleRenderer } from '@endfieldmap/map-adapter-ol/render/renderer';
import type { HitTestableLayer } from '@endfieldmap/map-adapter-ol/types/layer';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core';
import type { Feature, Map as OlMap, MapBrowserEvent, MapEvent } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { FeatureLike } from 'ol/Feature';
import type { Point } from 'ol/geom';

export type {
  DataInstance,
  DisposeListener,
  ListenerOptions,
  MapContextMenuEventDetail,
  MapEventEmitter,
  MapEventListener,
  MapEventListenerUnion,
} from '@endfieldmap/map-core';

/**
 * OL-specific: MAP_HOVER 事件的 detail 类型（含完整 OL 事件对象）
 */
export type OLMapHoverEventDetail = {
  event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
};

/**
 * OL-specific: ENTITY_CLICK 事件的 detail 类型（含完整 OL Feature）
 */
export type OLEntityEventDetail = {
  instance: import('@endfieldmap/map-core').DataInstance;
  feature: FeatureLike;
  event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
};

/**
 * OL-specific 右键菜单事件（含 OL Map 引用）
 */
export type OLMapContextMenuEventDetail = {
  pixel: [number, number];
  coordinate: Coordinate | undefined;
  originalEvent: MouseEvent;
  map: OlMap;
}

/**
 * OL-specific 事件映射（用于 OL adapter 内部事件处理）
 * 包含完整的 OL 事件对象，用于 OL 控制器内部逻辑
 * 使用 type 而非 interface，以满足 Record<string, unknown> 隐式索引签名约束
 */
export type OLMapEventPayloads = {
  'zoom:change': number;
  'map:click': MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent> & {
    hasHit?: boolean;
  };
  'map:hover': {
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  'map:center:change': Coordinate | undefined;
  'map:context_menu': OLMapContextMenuEventDetail;
  'feature:select': {
    features: Feature<Point>[];
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  'map:move_end': MapEvent;
  'cluster:click': {
    features: Feature<Point>[];
    instances: import('@endfieldmap/map-core').EntityDataInstance[];
    coordinates: Coordinate[];
    extent: Extent;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  'entity:click': {
    instance: import('@endfieldmap/map-core').DataInstance;
    feature: FeatureLike;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  'entity:hover': {
    instance: import('@endfieldmap/map-core').DataInstance | null;
    coordinate: Coordinate | null;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  'entity:context_menu': {
    instance: import('@endfieldmap/map-core').DataInstance;
    feature: FeatureLike;
    layer: HitTestableLayer;
    event: OLMapContextMenuEventDetail;
  };
  'connection:click': {
    feature: FeatureLike;
    instance: ElectricPoleDataInstance;
    targetId: number;
    renderer?: ElectricPoleRenderer;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  'connection:hover': {
    feature: FeatureLike | null;
    renderer?: ElectricPoleRenderer | null;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  'connection:context_menu': {
    feature: FeatureLike;
    renderer?: ElectricPoleRenderer;
    event: OLMapContextMenuEventDetail;
  };
  'active:feature:change': {
    oldFeature: import('@endfieldmap/map-core').DataInstance | null;
    newFeature: import('@endfieldmap/map-core').DataInstance | null;
    coordinate: Coordinate | null;
  };
  'hover:feature:change': {
    oldFeature: import('@endfieldmap/map-core').DataInstance | null;
    newFeature: import('@endfieldmap/map-core').DataInstance | null;
    coordinate: Coordinate | null;
  };
  'hover:connection:change': {
    oldFeature: FeatureLike | null;
    newFeature: FeatureLike | null;
    renderer?: ElectricPoleRenderer | null;
  };
  'selection:start': void;
}
