import type { CustomPointController } from '@endfieldmap/map-core/controller/entity/custom_point_controller';
import type { ElectricPoleController } from '@endfieldmap/map-core/controller/entity/electric_pole_controller';
import type { EntityController } from '@endfieldmap/map-core/controller/entity/entity_controller';
import type { CustomPointMapData, ElectricPoleMapData } from '@endfieldmap/map-core/types';
import type { ExportedData } from '@endfieldmap/map-core/types/data';
import { logger } from '@endfieldmap/tools';

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
export class DataController {
  private entityController: EntityController;
  private electricPoleController: ElectricPoleController;
  private customPointController: CustomPointController;
  private version: string;

  constructor(config: DataControllerConfig) {
    this.entityController = config.entityController;
    this.electricPoleController = config.electricPoleController;
    this.customPointController = config.customPointController;
    this.version = config.version || '1.0.0';
  }

  /**
   * 验证数据格式
   */
  private validateData(data: unknown): data is ExportedData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.version !== 'string') {
      return false;
    }

    if (typeof obj.timestamp !== 'number') {
      return false;
    }

    if (!obj.markedFeatures || typeof obj.markedFeatures !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * 导出所有数据
   */
  public exportData(): ExportedData {
    return {
      version: this.version,
      timestamp: Date.now(),
      markedFeatures: this.entityController.dataManager.markedData,
      entityVisibility: this.entityController.dataManager.visibilityData,
      electricPoleData: this.electricPoleController.dataManager.allData as ElectricPoleMapData,
      customPointData: this.customPointController.dataManager.allData as CustomPointMapData,
    };
  }

  /**
   * 导入数据
   */
  public async importData(data: ExportedData): Promise<boolean> {
    try {
      // 验证数据格式
      if (!this.validateData(data)) {
        logger.error('[DataController] Invalid data format');
        return false;
      }

      // 版本兼容性检查
      if (data.version !== this.version) {
        logger.warn('[DataController] Data version mismatch', {
          expected: this.version,
          actual: data.version,
        });
      }

      // 导入Entity标记数据
      if (data.markedFeatures) {
        await this.entityController.importMarked(data.markedFeatures);
      }

      // 导入Entity可见性数据
      if (data.entityVisibility) {
        await this.entityController.importVisibility(data.entityVisibility);
      }

      // 导入电线杆数据
      if (data.electricPoleData) {
        this.electricPoleController.loadElectricPoleData(data.electricPoleData);
      }

      // 导入自定义标点数据
      if (data.customPointData) {
        this.customPointController.loadCustomPointData(data.customPointData);
      }

      return true;
    } catch (error) {
      logger.error('[DataController] Failed to import data', error);
      return false;
    }
  }
}
