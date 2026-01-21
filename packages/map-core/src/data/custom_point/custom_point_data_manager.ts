import { BaseDataManager } from '@endfieldmap/map-core/data/base';
import { getCustomPointEntityInfo } from '@endfieldmap/map-core/data/custom_point/custom_point_config';
import { CustomPointDataInstance } from '@endfieldmap/map-core/data/custom_point/custom_point_data_instance';
import type { CustomPointData, CustomPointDataManagerConfig } from '@endfieldmap/map-core/types/entity';
import { computed } from 'mobx';

/**
 * 自定义标点数据管理器
 * 管理单个地图上的所有自定义标点数据
 */
export class CustomPointDataManager extends BaseDataManager<CustomPointData, CustomPointDataInstance> {
  constructor(config: CustomPointDataManagerConfig) {
    super({ mapIndex: config.mapIndex });

    // 初始化数据
    if (config.initialData && config.initialData.length > 0) {
      this.addBatch(config.initialData);
    }
  }

  /**
   * 创建自定义标点数据实例
   */
  protected createInstance(data: CustomPointData): CustomPointDataInstance {
    if (!data.entityInfo) {
      data.entityInfo = getCustomPointEntityInfo(data.entityDataIdKey);
    }
    return new CustomPointDataInstance({
      data,
      mapIndex: this.mapIndex,
    });
  }

  /**
   * 获取所有数据（用于导出）
   */
  @computed
  get exportData(): CustomPointData[] {
    return this.instances.map((instance) => instance.data);
  }

  /**
   * 按类型过滤实例
   */
  public getByType(typeId: string): CustomPointDataInstance[] {
    return this.instances.filter((instance) => instance.typeId === typeId);
  }
}
