import type { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { ElectricPoleRenderer } from '@endfieldmap/map-core/render/renderer';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import type { HitTestableLayer } from '@endfieldmap/map-core/types/layer';
import type { Feature, Map as OlMap, MapBrowserEvent, MapEvent } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { FeatureLike } from 'ol/Feature';
import type { Point } from 'ol/geom';

/**
 * 数据实例联合类型
 * 所有可能的 DataInstance 类型
 */
export type DataInstance = EntityDataInstance | CustomPointDataInstance | ElectricPoleDataInstance;

export interface MapContextMenuEventDetail {
  pixel: [number, number];
  coordinate: Coordinate | undefined;
  originalEvent: MouseEvent;
  map: OlMap;
}

export interface MapEventEmitter {
  /** 数据实例ID */
  id: number;
  /** 变化的属性名 */
  property: 'marked' | 'selected' | 'active' | 'visible';
  /** 旧值 */
  oldValue: boolean;
  /** 新值 */
  newValue: boolean;
}

export interface MapEventEmitter {
  // 基于 ol 的
  [MAP_EVENT.ZOOM_CHANGE]: number;
  [MAP_EVENT.MAP_CLICK]: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent> & {
    hasHit?: boolean;
  };
  [MAP_EVENT.MAP_HOVER]: {
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  [MAP_EVENT.MAP_CENTER_CHANGE]: Coordinate | undefined;
  [MAP_EVENT.MAP_CONTEXT_MENU]: MapContextMenuEventDetail;
  [MAP_EVENT.FEATURE_SELECT]: {
    features: Feature<Point>[];
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  [MAP_EVENT.MAP_MOVE_END]: MapEvent;

  // 高级封装的
  [MAP_EVENT.CLUSTER_CLICK]: {
    features: Feature<Point>[];
    instances: EntityDataInstance[];
    coordinates: Coordinate[];
    extent: Extent;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  [MAP_EVENT.ENTITY_CLICK]: {
    instance: DataInstance;
    feature: FeatureLike;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  [MAP_EVENT.ENTITY_HOVER]: {
    instance: DataInstance | null;
    coordinate: Coordinate | null;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  [MAP_EVENT.ENTITY_CONTEXT_MENU]: {
    instance: DataInstance;
    feature: FeatureLike;
    layer: HitTestableLayer;
    event: MapContextMenuEventDetail;
  };
  [MAP_EVENT.CONNECTION_CLICK]: {
    feature: FeatureLike;
    /** 电线杆数据实例（连接的起始点） */
    instance: ElectricPoleDataInstance;
    /** 连线目标 ID（由 instance 发出） */
    targetId: number;
    renderer?: ElectricPoleRenderer;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  [MAP_EVENT.CONNECTION_HOVER]: {
    feature: FeatureLike | null;
    renderer?: ElectricPoleRenderer | null;
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>;
  };
  [MAP_EVENT.CONNECTION_CONTEXT_MENU]: {
    feature: FeatureLike;
    renderer?: ElectricPoleRenderer;
    event: MapContextMenuEventDetail;
  };
  [MAP_EVENT.ACTIVE_FEATURE_CHANGE]: {
    oldFeature: DataInstance | null;
    newFeature: DataInstance | null;
    coordinate: Coordinate | null;
  };
  [MAP_EVENT.HOVER_FEATURE_CHANGE]: {
    oldFeature: DataInstance | null;
    newFeature: DataInstance | null;
    coordinate: Coordinate | null;
  };
  [MAP_EVENT.HOVER_CONNECTION_CHANGE]: {
    oldFeature: FeatureLike | null;
    newFeature: FeatureLike | null;
    renderer?: ElectricPoleRenderer | null;
  };
  [MAP_EVENT.SELECTION_START]: void;
}

/**
 * 事件监听器选项
 */
export interface ListenerOptions {
  /** 是否只执行一次 */
  once?: boolean;
}

export type MapEventListener<T extends keyof MapEventEmitter> = (event: MapEventEmitter[T]) => void;

export type MapEventListenerUnion = MapEventListener<keyof MapEventEmitter>;

export type DisposeListener = () => void;
