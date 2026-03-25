import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import type {
  IActiveFeatureController,
  ICustomPointController,
  IElectricPoleController,
  IEntityController,
  IHoverConnectionController,
  IHoverFeatureController,
  IMapController,
  ITierController,
} from '@endfieldmap/map-core/interfaces/controllers';
import type { EntitySearchRegistry } from '@endfieldmap/map-core/data/entity_search_registry';
import type { MapEventEmitter } from '@endfieldmap/map-core/types/event';
import type { MapData } from '@endfieldmap/map-core/types/map';

/**
 * 抽象地图适配器接口
 * 不同的渲染引擎（OpenLayers, MapLibre 等）实现此接口
 *
 * 适配器负责将渲染引擎原始事件转换为 MapEventEmitter 领域事件，
 * 通过 event getter 暴露类型安全的 EndfieldMapEmitter<MapEventEmitter>
 */
export interface IMapAdapter {
  readonly event: EndfieldMapEmitter<MapEventEmitter>;
  readonly mapController: IMapController;
  readonly entityController: IEntityController;
  readonly electricPoleController: IElectricPoleController;
  readonly customPointController: ICustomPointController;
  readonly tierController: ITierController;
  readonly activeFeatureController: IActiveFeatureController;
  readonly hoverFeatureController: IHoverFeatureController;
  readonly hoverConnectionController: IHoverConnectionController;
  readonly entityRegistry: EntitySearchRegistry;

  enableHover: boolean;
  hoverDebounceTime: number;

  setKeyboardMoveSpeed?(speed: number): void;

  renderMap(mapId: MapData['id']): void;
  renderAreaName(zoom?: number): void;
  setActiveFeatureEnable(enable: boolean): void;
  setHoverFeatureEnable(enable: boolean): void;
  setHoverDebounceTime(time: number): void;
  setClusterEnable(enable: boolean): void;
  dispose(): void;
}
