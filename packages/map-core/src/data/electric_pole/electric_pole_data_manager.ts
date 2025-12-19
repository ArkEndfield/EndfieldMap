import { ElectricPoleIdKey, ElectricPoleKey } from '@endfieldmap/map-core/const/map';
import { BaseDataManager } from '@endfieldmap/map-core/data/base';
import { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/electric_pole/electric_pole_data_instance';
import type { EntityInfo } from '@endfieldmap/map-core/data/entity';
import type { ElectricPoleData, ElectricPoleDataManagerConfig } from '@endfieldmap/map-core/types/entity';
import { logger } from '@endfieldmap/tools';
import { action, computed } from 'mobx';

/** 默认的电线杆Entity信息 */
const DEFAULT_ELECTRIC_POLE_ENTITY_INFO: EntityInfo = {
  category: ElectricPoleKey,
  entityInfo: {
    pic: 'icon_map_big_pole',
    point: ElectricPoleIdKey,
  },
};

/**
 * 电线杆数据管理器
 * 管理单个地图上的所有电线杆数据
 */
export class ElectricPoleDataManager extends BaseDataManager<
  ElectricPoleData,
  ElectricPoleDataInstance
> {
  /** Entity信息 */
  public readonly entityInfo: EntityInfo;

  constructor(config: ElectricPoleDataManagerConfig) {
    super({ mapIndex: config.mapIndex });
    this.entityInfo = DEFAULT_ELECTRIC_POLE_ENTITY_INFO;

    // 初始化数据
    if (config.initialData && config.initialData.length > 0) {
      this.initializeData(config.initialData);
    }
  }

  /**
   * 创建电线杆数据实例
   */
  protected createInstance(data: ElectricPoleData): ElectricPoleDataInstance {
    return new ElectricPoleDataInstance({
      data,
      mapIndex: this.mapIndex,
      entityInfo: this.entityInfo,
    });
  }

  /**
   * 初始化数据并同步连接关系
   */
  @action
  private initializeData(dataList: ElectricPoleData[]): void {
    // 先添加所有实例
    this.addBatch(dataList);

    // 然后同步连接关系
    this.syncAllConnections();
  }

  /**
   * 同步所有连接关系
   */
  @action
  public syncAllConnections(): void {
    for (const instance of this.instances) {
      this.syncConnection(instance);
    }
  }

  /**
   * 同步单个电线杆的连接关系
   */
  @action
  private syncConnection(instance: ElectricPoleDataInstance): void {
    const connectToId = instance.connectToId;
    if (connectToId === null) {
      return;
    }

    const targetInstance = this.getById(connectToId);
    if (!targetInstance) {
      logger.warn('[ElectricPoleDataManager] Connection target not found', {
        mapIndex: this.mapIndex,
        from: instance.id,
        to: connectToId,
      });
      return;
    }

    // 建立连接关系（不修改data，只设置引用）
    instance.connectionTo = targetInstance;
    targetInstance.setConnectionFrom(instance);
  }

  /**
   * 添加电线杆并同步连接
   */
  @action
  public addWithConnection(data: ElectricPoleData): ElectricPoleDataInstance {
    const instance = this.add(data);
    this.syncConnection(instance);
    return instance;
  }

  /**
   * 移除电线杆并清理连接
   */
  @action
  public removeWithCleanup(id: number): boolean {
    const instance = this.getById(id);
    if (!instance) {
      return false;
    }

    // 清理连接关系
    instance.clearAllConnections();

    return this.remove(id);
  }

  /**
   * 获取所有数据（用于导出）
   */
  @computed
  get exportData(): ElectricPoleData[] {
    return this.instances.map((instance) => ({
      ...instance.data,
      properties: {
        ...instance.data.properties,
        connectTo: instance.connectionTo?.id ?? null,
      },
    }));
  }
}
