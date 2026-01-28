import type { CustomPointController } from '@endfieldmap/map-core/controller/entity/custom_point_controller';
import type { ElectricPoleController } from '@endfieldmap/map-core/controller/entity/electric_pole_controller';
import type { EntityController } from '@endfieldmap/map-core/controller/entity/entity_controller';

/**
 * 数据控制器配置
 */
export interface DataControllerConfig {
  /** Entity控制器 */
  entityController: EntityController;
  /** 电线杆控制器 */
  electricPoleController: ElectricPoleController;
  /** 自定义标点控制器 */
  customPointController: CustomPointController;
  /** 数据版本 */
  version?: string;
}

/**
 * 数据控制器
 * 负责处理数据的导入导出
 */
// export class DataController {
//   private entityController: EntityController;
//   private electricPoleController: ElectricPoleController;
//   private customPointController: CustomPointController;
//   private version: string;

//   constructor(config: DataControllerConfig) {
//     this.entityController = config.entityController;
//     this.electricPoleController = config.electricPoleController;
//     this.customPointController = config.customPointController;
//     this.version = config.version || '1.0.0';
//   }
// }
