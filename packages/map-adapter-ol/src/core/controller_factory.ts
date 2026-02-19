import {
  CustomPointController,
  type CustomPointControllerConfig,
} from '@endfieldmap/map-adapter-ol/controller/entity/custom_point_controller';
import {
  ElectricPoleController,
  type ElectricPoleControllerConfig,
} from '@endfieldmap/map-adapter-ol/controller/entity/electric_pole_controller';
import {
  EntityController,
  type EntityControllerConfig,
} from '@endfieldmap/map-adapter-ol/controller/entity/entity_controller';
import {
  BatchCreateCustomPointsCommand,
  BatchCreateElectricPolesCommand,
  BatchDeleteCustomPointsCommand,
  BatchDeleteElectricPolesCommand,
  CreateCustomPointCommand,
  CreateElectricPoleCommand,
  DeleteCustomPointCommand,
  DeleteElectricPoleCommand,
} from '@endfieldmap/map-adapter-ol/history';
import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core/const/electric_pole';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import { historyManager } from '@endfieldmap/map-core/history';
import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';
import type { CustomPointTypeId } from '@endfieldmap/map-core/types/entity';
import type { MapData } from '@endfieldmap/map-core/types/map';

/**
 * 控制器工厂接口
 * 用于依赖注入和测试
 */
export interface IControllerFactory {
  createEntityController(config: EntityControllerConfig): EntityController;
  createElectricPoleController(config: ElectricPoleControllerConfig): ElectricPoleController;
  createCustomPointController(config: CustomPointControllerConfig): CustomPointController;
}

/**
 * 默认控制器工厂
 * 创建标准的控制器实例
 */
export class DefaultControllerFactory implements IControllerFactory {
  createEntityController(config: EntityControllerConfig): EntityController {
    return new EntityController(config);
  }

  createElectricPoleController(config: ElectricPoleControllerConfig): ElectricPoleController {
    return new ElectricPoleController(config);
  }

  createCustomPointController(config: CustomPointControllerConfig): CustomPointController {
    return new CustomPointController(config);
  }
}

/**
 * 带历史记录的电线杆控制器包装器
 * 提供带撤销/重做支持的 CRUD 操作和批量 API
 */
export class ElectricPoleControllerWithHistory {
  constructor(private readonly controller: ElectricPoleController) {}

  /**
   * 创建电线杆（带历史记录）
   */
  create(
    mapId: MapData['id'],
    position: MapCoordinate,
    deviceKey?: ElectricPoleDeviceKey
  ): ElectricPoleDataInstance | null {
    const command = new CreateElectricPoleCommand(this.controller, mapId, position, deviceKey);
    historyManager.execute(command);
    const instances = this.controller.dataManager.getMapManager(mapId).instances;
    return instances[instances.length - 1] ?? null;
  }

  /**
   * 删除电线杆（带历史记录）
   */
  delete(mapId: MapData['id'], instance: ElectricPoleDataInstance): boolean {
    const command = new DeleteElectricPoleCommand(this.controller, mapId, instance);
    historyManager.execute(command);
    return true;
  }

  /**
   * 批量创建电线杆（带历史记录）
   */
  batchCreate(
    mapId: MapData['id'],
    positions: MapCoordinate[],
    deviceKey?: ElectricPoleDeviceKey
  ): ElectricPoleDataInstance[] {
    const command = new BatchCreateElectricPolesCommand(this.controller, mapId, positions, deviceKey);
    historyManager.execute(command);
    // 返回创建的实例
    const manager = this.controller.dataManager.getMapManager(mapId);
    return manager.instances.slice(-positions.length);
  }

  /**
   * 批量删除电线杆（带历史记录）
   */
  batchDelete(mapId: MapData['id'], ids: number[]): number {
    const command = new BatchDeleteElectricPolesCommand(this.controller, mapId, ids);
    historyManager.execute(command);
    return ids.length;
  }
}

/**
 * 带历史记录的自定义标点控制器包装器
 * 提供带撤销/重做支持的 CRUD 操作和批量 API
 */
export class CustomPointControllerWithHistory {
  constructor(private readonly controller: CustomPointController) {}

  /**
   * 创建自定义标点（带历史记录）
   */
  create(mapId: MapData['id'], position: MapCoordinate, type: CustomPointTypeId): CustomPointDataInstance | null {
    const command = new CreateCustomPointCommand(this.controller, mapId, position, type);
    historyManager.execute(command);
    const instances = this.controller.dataManager.getMapManager(mapId).instances;
    return instances[instances.length - 1] ?? null;
  }

  /**
   * 删除自定义标点（带历史记录）
   */
  delete(mapId: MapData['id'], instance: CustomPointDataInstance): boolean {
    const command = new DeleteCustomPointCommand(this.controller, mapId, instance);
    historyManager.execute(command);
    return true;
  }

  /**
   * 批量创建自定义标点（带历史记录）
   */
  batchCreate(
    mapId: MapData['id'],
    items: Array<{ position: MapCoordinate; type: CustomPointTypeId }>
  ): CustomPointDataInstance[] {
    const command = new BatchCreateCustomPointsCommand(this.controller, mapId, items);
    historyManager.execute(command);
    const manager = this.controller.dataManager.getMapManager(mapId);
    return manager.instances.slice(-items.length);
  }

  /**
   * 批量删除自定义标点（带历史记录）
   */
  batchDelete(mapId: MapData['id'], ids: number[]): number {
    const command = new BatchDeleteCustomPointsCommand(this.controller, mapId, ids);
    historyManager.execute(command);
    return ids.length;
  }
}
