import type { MapIndex } from '@endfieldmap/map-core/const/map';
import type { CustomPointControllerConfig } from '@endfieldmap/map-core/controller/entity/custom_point_controller';
import { CustomPointController } from '@endfieldmap/map-core/controller/entity/custom_point_controller';
import type { ElectricPoleControllerConfig } from '@endfieldmap/map-core/controller/entity/electric_pole_controller';
import { ElectricPoleController } from '@endfieldmap/map-core/controller/entity/electric_pole_controller';
import type { EntityControllerConfig } from '@endfieldmap/map-core/controller/entity/entity_controller';
import { EntityController } from '@endfieldmap/map-core/controller/entity/entity_controller';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/custom_point';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/electric_pole';
import {
  BatchCreateCustomPointsCommand,
  BatchCreateElectricPolesCommand,
  BatchDeleteCustomPointsCommand,
  BatchDeleteElectricPolesCommand,
  CreateCustomPointCommand,
  CreateElectricPoleCommand,
  DeleteCustomPointCommand,
  DeleteElectricPoleCommand,
  historyManager,
} from '@endfieldmap/map-core/history';
import type { CustomPointTypeId } from '@endfieldmap/map-core/types/entity';
import type { Coordinate } from 'ol/coordinate';

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
  create(mapIndex: MapIndex, position: Coordinate): ElectricPoleDataInstance | null {
    const command = new CreateElectricPoleCommand(this.controller, mapIndex, position);
    historyManager.execute(command);
    const instances = this.controller.dataManager.getMapManager(mapIndex).instances;
    return instances[instances.length - 1] ?? null;
  }

  /**
   * 删除电线杆（带历史记录）
   */
  delete(mapIndex: MapIndex, instance: ElectricPoleDataInstance): boolean {
    const command = new DeleteElectricPoleCommand(this.controller, mapIndex, instance);
    historyManager.execute(command);
    return true;
  }

  /**
   * 批量创建电线杆（带历史记录）
   */
  batchCreate(mapIndex: MapIndex, positions: Coordinate[]): ElectricPoleDataInstance[] {
    const command = new BatchCreateElectricPolesCommand(this.controller, mapIndex, positions);
    historyManager.execute(command);
    // 返回创建的实例
    const manager = this.controller.dataManager.getMapManager(mapIndex);
    return manager.instances.slice(-positions.length);
  }

  /**
   * 批量删除电线杆（带历史记录）
   */
  batchDelete(mapIndex: MapIndex, ids: number[]): number {
    const command = new BatchDeleteElectricPolesCommand(this.controller, mapIndex, ids);
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
  create(mapIndex: MapIndex, position: Coordinate, type: CustomPointTypeId): CustomPointDataInstance | null {
    const command = new CreateCustomPointCommand(this.controller, mapIndex, position, type);
    historyManager.execute(command);
    const instances = this.controller.dataManager.getMapManager(mapIndex).instances;
    return instances[instances.length - 1] ?? null;
  }

  /**
   * 删除自定义标点（带历史记录）
   */
  delete(mapIndex: MapIndex, instance: CustomPointDataInstance): boolean {
    const command = new DeleteCustomPointCommand(this.controller, mapIndex, instance);
    historyManager.execute(command);
    return true;
  }

  /**
   * 批量创建自定义标点（带历史记录）
   */
  batchCreate(
    mapIndex: MapIndex,
    items: Array<{ position: Coordinate; type: CustomPointTypeId }>
  ): CustomPointDataInstance[] {
    const command = new BatchCreateCustomPointsCommand(this.controller, mapIndex, items);
    historyManager.execute(command);
    const manager = this.controller.dataManager.getMapManager(mapIndex);
    return manager.instances.slice(-items.length);
  }

  /**
   * 批量删除自定义标点（带历史记录）
   */
  batchDelete(mapIndex: MapIndex, ids: number[]): number {
    const command = new BatchDeleteCustomPointsCommand(this.controller, mapIndex, ids);
    historyManager.execute(command);
    return ids.length;
  }
}
