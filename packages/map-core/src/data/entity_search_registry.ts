import type { DataInstance } from '@endfieldmap/map-core/types/event';

/**
 * 实体搜索注册项
 * 定义每种实体类型在搜索、可见性切换等通用操作中需要提供的能力
 * 与渲染引擎无关，可在所有适配器中共享
 */
export interface EntitySearchRegistration {
  /** 判断该注册项是否匹配给定的数据实例 */
  matchesInstance: (instance: DataInstance) => boolean;
  /** 在指定地图中按 ID 搜索数据实例 */
  searchById: (mapId: string, id: number) => DataInstance | undefined;
  /** 检查实例所属组/类型是否可见 */
  isGroupVisible: (instance: DataInstance) => boolean;
}

/**
 * 实体搜索注册表（引擎无关）
 * 统一管理所有实体类型的注册信息，解决开闭原则 (OCP) 违反问题
 * 新增实体类型只需调用 register() 注册，无需修改已有代码
 */
export class EntitySearchRegistry<T extends EntitySearchRegistration = EntitySearchRegistration> {
  protected registrations: T[] = [];

  /**
   * 注册一个实体类型
   */
  register(registration: T): void {
    this.registrations.push(registration);
  }

  /**
   * 在所有已注册类型中按 ID 搜索实例
   */
  searchById(mapIds: string[], id: number): DataInstance | undefined {
    for (const reg of this.registrations) {
      for (const mapId of mapIds) {
        const instance = reg.searchById(mapId, id);
        if (instance) return instance;
      }
    }
    return undefined;
  }

  /**
   * 查找匹配给定实例的注册项
   */
  findRegistration(instance: DataInstance): T | undefined {
    return this.registrations.find((r) => r.matchesInstance(instance));
  }

  /**
   * 检查实例所属组是否可见
   */
  isGroupVisible(instance: DataInstance): boolean {
    return this.findRegistration(instance)?.isGroupVisible(instance) ?? true;
  }
}
