import type { EntitySearchRegistry } from '@endfieldmap/map-core/data/entity_search_registry';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import type {
  IActiveFeatureController,
  ICustomPointController,
  IElectricPoleController,
  IEntityController,
  IHoverConnectionController,
  IHoverFeatureController,
  IMapController,
  IRouteController,
  ITierController,
} from '@endfieldmap/map-core/interfaces/controllers';
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
  /**
   * 路线控制器。地图路线是 web 端能力，原生适配器（MapLibre）暂未实现，
   * 故为可选；调用方需按可选处理（无则不渲染路线）。
   */
  readonly routeController?: IRouteController;

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
