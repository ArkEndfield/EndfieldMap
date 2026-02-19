import type { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';

/**
 * 数据实例联合类型
 */
export type DataInstance = EntityDataInstance | CustomPointDataInstance | ElectricPoleDataInstance;

/**
 * 右键菜单事件详情（抽象，无 OL 依赖）
 */
export type MapContextMenuEventDetail = {
  pixel: [number, number];
  coordinate: MapCoordinate | undefined;
  originalEvent: MouseEvent;
}

/**
 * 抽象事件映射（无 OL 依赖）
 * 适配器层负责将渲染引擎原始事件转换为这些领域事件
 * 使用 type 而非 interface，以满足 Record<string, unknown> 隐式索引签名约束
 */
export type MapEventEmitter = {
  [MAP_EVENT.ZOOM_CHANGE]: number;
  [MAP_EVENT.MAP_CLICK]: {
    coordinate: MapCoordinate;
    pixel: [number, number];
    hasHit?: boolean;
  };
  [MAP_EVENT.MAP_HOVER]: {
    coordinate: MapCoordinate;
    pixel: [number, number];
  };
  [MAP_EVENT.MAP_CENTER_CHANGE]: MapCoordinate | undefined;
  [MAP_EVENT.MAP_CONTEXT_MENU]: MapContextMenuEventDetail;
  [MAP_EVENT.MAP_MOVE_END]: void;

  [MAP_EVENT.FEATURE_SELECT]: {
    instances: EntityDataInstance[];
    coordinates: MapCoordinate[];
  };

  [MAP_EVENT.CLUSTER_CLICK]: {
    instances: EntityDataInstance[];
    coordinates: MapCoordinate[];
    extent: [number, number, number, number];
  };
  [MAP_EVENT.ENTITY_CLICK]: {
    instance: DataInstance;
    coordinate: MapCoordinate;
  };
  [MAP_EVENT.ENTITY_HOVER]: {
    instance: DataInstance | null;
    coordinate: MapCoordinate | null;
  };
  [MAP_EVENT.ENTITY_CONTEXT_MENU]: {
    instance: DataInstance;
    event: MapContextMenuEventDetail;
  };
  [MAP_EVENT.CONNECTION_CLICK]: {
    instance: ElectricPoleDataInstance;
    targetId: number;
  };
  [MAP_EVENT.CONNECTION_HOVER]: {
    targetId: number | null;
  };
  [MAP_EVENT.CONNECTION_CONTEXT_MENU]: {
    event: MapContextMenuEventDetail;
  };
  [MAP_EVENT.ACTIVE_FEATURE_CHANGE]: {
    oldFeature: DataInstance | null;
    newFeature: DataInstance | null;
    coordinate: MapCoordinate | null;
  };
  [MAP_EVENT.HOVER_FEATURE_CHANGE]: {
    oldFeature: DataInstance | null;
    newFeature: DataInstance | null;
    coordinate: MapCoordinate | null;
  };
  [MAP_EVENT.HOVER_CONNECTION_CHANGE]: {
    oldTargetId: number | null;
    newTargetId: number | null;
  };
  [MAP_EVENT.SELECTION_START]: void;
}

/**
 * 事件监听器选项
 */
export interface ListenerOptions {
  once?: boolean;
}

export type MapEventListener<T extends keyof MapEventEmitter> = (event: MapEventEmitter[T]) => void;

export type MapEventListenerUnion = MapEventListener<keyof MapEventEmitter>;

export type DisposeListener = () => void;
