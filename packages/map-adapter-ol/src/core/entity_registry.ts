import type { HitTestableLayer } from '@endfieldmap/map-adapter-ol/types/layer';
import { type EntitySearchRegistration, EntitySearchRegistry } from '@endfieldmap/map-core';

/**
 * 实体类型注册项（OL 适配器扩展）
 * 在通用搜索/可见性能力基础上，增加 OL 渲染层需要的 hit test 图层信息
 */
export interface EntityTypeRegistration extends EntitySearchRegistration {
  /** 获取当前可命中测试的图层 */
  getHitTestLayers: () => HitTestableLayer[];
  /** 该类型是否使用聚合渲染（决定 hit test 方法） */
  clustered: boolean;
}

/**
 * 实体类型注册表（OL 适配器扩展）
 * 在通用注册表基础上，增加聚合/非聚合图层分组查询
 */
export class EntityTypeRegistry extends EntitySearchRegistry<EntityTypeRegistration> {
  /**
   * 获取所有聚合图层（用于 hit test 中的 clustered layer 处理）
   */
  getClusteredLayers(): HitTestableLayer[] {
    return this.registrations.filter((r) => r.clustered).flatMap((r) => r.getHitTestLayers());
  }

  /**
   * 获取所有非聚合图层（用于 hit test 中的 non-clustered layer 处理）
   */
  getNonClusteredLayers(): HitTestableLayer[] {
    return this.registrations.filter((r) => !r.clustered).flatMap((r) => r.getHitTestLayers());
  }
}
