import type { EntityController } from '@endfieldmap/map-core/controller/entity';
import type { ExportedData } from '@endfieldmap/map-core/types/data';
import { logger } from '@endfieldmap/tools';

/**
 * 数据控制器配置
 */
export interface DataControllerConfig {
  /** entity控制器 */
  entityController: EntityController;
  /** 数据版本 */
  version?: string;
}

/**
 * 数据控制器
 * 负责处理数据的导入导出
 */
export class DataController {
  private entityController: EntityController;
  private version: string;

  constructor(config: DataControllerConfig) {
    this.entityController = config.entityController;
    this.version = config.version || '1.0.0';
  }

  /**
   * 验证数据格式
   * @param data 要验证的数据
   * @returns 数据是否有效
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

    return this.entityController.validateMarkedFeatures(obj.markedFeatures);
  }

  /**
   * 导入数据
   * @param data 要导入的数据对象
   * @returns 导入是否成功
   */
  public importData(data: ExportedData): boolean {
    try {
      // 验证数据格式
      if (!this.validateData(data)) {
        logger.error('[DataController|importData] Invalid data format');
        return false;
      }

      // 版本兼容性检查
      if (data.version !== this.version) {
        logger.warn('[DataController|importData] Data version mismatch', {
          expected: this.version,
          actual: data.version,
        });
        // 可以在这里添加版本迁移逻辑
      }
      return true;
    } catch (error) {
      logger.error('[DataController|importData] Failed to import data', error);
      return false;
    }
  }
}
