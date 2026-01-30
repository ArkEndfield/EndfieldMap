import {
  DEFAULT_ELECTRIC_POLE_DEVICE_KEY,
  type ElectricPoleDeviceKey,
  LEGACY_ELECTRIC_POLE_DEVICE_KEY,
} from '@endfieldmap/map-core/const/electric_pole';
import { ElectricPoleIdKey, ElectricPoleKey } from '@endfieldmap/map-core/const/map';
import { BaseDataManager } from '@endfieldmap/map-core/data/base';
import { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole/electric_pole_data_instance';
import type {
  ElectricPoleData,
  ElectricPoleDataManagerConfig,
  EntityInfoData,
} from '@endfieldmap/map-core/types/entity';
import { logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';

/** 默认的电线杆Entity信息 */
const DEFAULT_ELECTRIC_POLE_ENTITY_INFO: EntityInfoData = {
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
export class ElectricPoleDataManager extends BaseDataManager<ElectricPoleData, ElectricPoleDataInstance> {
  /** Entity信息 */
  public readonly entityInfo: EntityInfoData;

  /** 设备类型可见性 */
  @observable
  accessor deviceVisibility: Map<ElectricPoleDeviceKey, boolean> = new Map();

  constructor(config: ElectricPoleDataManagerConfig) {
    super({ mapId: config.mapId });
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
    // 复制数据对象，避免修改冻结的对象（如 RxDB documentData）
    const dataCopy = { ...data };
    if (!dataCopy.entityInfo) {
      dataCopy.entityInfo = this.entityInfo;
    }
    const instance = new ElectricPoleDataInstance({
      data: dataCopy,
      mapId: this.mapId,
    });

    // 应用可见性
    const deviceKey = instance.deviceKey;
    const isVisible = this.deviceVisibility.get(deviceKey) ?? true;
    instance.setVisible(isVisible);

    return instance;
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
    const byId = new Map<number, ElectricPoleDataInstance>();
    for (const instance of this.instances) {
      byId.set(instance.id, instance);
    }

    const outgoingRefs = new Map<number, ElectricPoleDataInstance[]>();
    const incomingRefs = new Map<number, ElectricPoleDataInstance[]>();
    for (const instance of this.instances) {
      outgoingRefs.set(instance.id, []);
      incomingRefs.set(instance.id, []);
    }

    for (const instance of this.instances) {
      const normalizedTargetIds = this.normalizeOutgoingConnectionIds(instance, byId);

      // 写回规范化数据（并清理 legacy 字段）
      instance.setOutgoingConnectionIds(normalizedTargetIds);

      for (const targetId of normalizedTargetIds) {
        const targetInstance = byId.get(targetId);
        if (!targetInstance) {
          continue;
        }
        outgoingRefs.get(instance.id)!.push(targetInstance);
        incomingRefs.get(targetInstance.id)!.push(instance);
      }
    }

    for (const instance of this.instances) {
      instance.setOutgoingConnections(outgoingRefs.get(instance.id) ?? []);
      instance.setIncomingConnections(incomingRefs.get(instance.id) ?? []);
    }
  }

  /**
   * 规范化单个实例的发出连线 ID 列表
   */
  @action
  private normalizeOutgoingConnectionIds(
    instance: ElectricPoleDataInstance,
    byId: Map<number, ElectricPoleDataInstance>
  ): number[] {
    const raw = instance.data.properties.connections;

    const merged: number[] = [];
    if (Array.isArray(raw)) {
      for (const id of raw) {
        if (typeof id === 'number' && Number.isFinite(id)) merged.push(id);
      }
    }

    const seen = new Set<number>();
    const result: number[] = [];
    for (const targetId of merged) {
      if (targetId === instance.id) {
        continue;
      }
      if (seen.has(targetId)) {
        continue;
      }
      if (!byId.has(targetId)) {
        logger.warn('[ElectricPoleDataManager] Connection target not found', {
          mapId: this.mapId,
          from: instance.id,
          to: targetId,
        });
        continue;
      }
      seen.add(targetId);
      result.push(targetId);
    }

    return result;
  }

  /**
   * 添加电线杆并同步连接
   */
  @action
  public addWithConnection(data: ElectricPoleData): ElectricPoleDataInstance {
    const instance = this.add(data);
    this.syncAllConnections();
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

    // 清理连接关系（已经更新了所有相关实例的引用，无需再 syncAllConnections）
    instance.clearAllConnections();

    return this.remove(id);
  }

  /**
   * 设置指定设备类型的可见性
   */
  @action
  public setDeviceVisible(deviceKey: ElectricPoleDeviceKey, visible: boolean): void {
    this.deviceVisibility.set(deviceKey, visible);

    // 更新现有实例
    for (const instance of this.instances) {
      if (instance.deviceKey === deviceKey) {
        instance.setVisible(visible);
      }
    }
  }

  /**
   * 获取指定设备类型的可见性
   */
  public getDeviceVisible(deviceKey: ElectricPoleDeviceKey): boolean {
    return this.deviceVisibility.get(deviceKey) ?? true;
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
        connections: instance.outgoingConnectionIds,
      },
    }));
  }
}
