import { BaseDataManager } from '@endfieldmap/map-core/data/base';
import { getCustomPointEntityInfo } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_config';
import { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_data_instance';
import type { CustomPointData, CustomPointDataManagerConfig } from '@endfieldmap/map-core/types/entity';
import { action, computed, observable } from 'mobx';

/**
 * 自定义标点数据管理器
 * 管理单个地图上的所有自定义标点数据
 */
export class CustomPointDataManager extends BaseDataManager<CustomPointData, CustomPointDataInstance> {
  constructor(config: CustomPointDataManagerConfig) {
    super({ mapId: config.mapId });

    // 初始化数据
    if (config.initialData && config.initialData.length > 0) {
      this.addBatch(config.initialData);
    }
  }

  /** 类型可见性 */
  @observable
  accessor typeVisibility: Map<string, boolean> = new Map();

  /**
   * 创建自定义标点数据实例
   */
  protected createInstance(data: CustomPointData): CustomPointDataInstance {
    // 复制数据对象，避免修改冻结的对象（如 RxDB documentData）
    const dataCopy = { ...data };
    if (!dataCopy.entityInfo) {
      dataCopy.entityInfo = getCustomPointEntityInfo(dataCopy.entityDataIdKey);
    }
    const instance = new CustomPointDataInstance({
      data: dataCopy,
      mapId: this.mapId,
    });

    // 应用可见性
    const typeId = instance.typeId; // 假设 CustomPointDataInstance 有 typeId (对应 entityDataIdKey)
    const isVisible = this.typeVisibility.get(typeId) ?? true;
    instance.setVisible(isVisible);

    return instance;
  }

  /**
   * 设置指定类型的可见性
   */
  @action
  public setTypeVisible(typeId: string, visible: boolean): void {
    this.typeVisibility.set(typeId, visible);

    // 更新现有实例
    for (const instance of this.instances) {
      if (instance.typeId === typeId) {
        instance.setVisible(visible);
      }
    }
  }

  /**
   * 获取指定类型的可见性
   */
  public getTypeVisible(typeId: string): boolean {
    return this.typeVisibility.get(typeId) ?? true;
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
