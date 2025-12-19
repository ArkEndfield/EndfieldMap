import { BaseDataManager } from '@endfieldmap/map-core/data/base';
import { EntityDataInstance } from '@endfieldmap/map-core/data/entity/entity_data_instance';
import type {
  Category,
  EntityData,
  EntityGroupManagerConfig,
  EntityInfoData,
  EntityInfoStats,
} from '@endfieldmap/map-core/types/entity';
import { action, computed, observable } from 'mobx';

/**
 * Entity组数据管理器
 * 管理同一个entityDataIdKey下的所有Entity实例
 */
export class EntityGroupManager extends BaseDataManager<EntityData, EntityDataInstance> {
  /** 实体数据ID键 */
  public readonly entityDataIdKey: string;

  /** Entity信息 */
  @observable
  accessor entityInfo: EntityInfoData;

  /** 分类 */
  public readonly category: Category;

  /** 组是否可见 */
  @observable
  accessor groupVisible: boolean = false;

  constructor(config: EntityGroupManagerConfig) {
    super({ mapIndex: config.mapIndex });
    this.entityDataIdKey = config.entityDataIdKey;
    this.entityInfo = config.entityInfo;
    this.category = config.category;

    // 初始化数据
    if (config.initialData && config.initialData.length > 0) {
      this.addBatch(config.initialData);
    }
  }

  /**
   * 创建Entity数据实例
   */
  protected createInstance(data: EntityData): EntityDataInstance {
    return new EntityDataInstance({
      data,
      mapIndex: this.mapIndex,
      entityInfo: this.entityInfo,
    });
  }

  /**
   * 设置组可见性
   */
  @action
  public setGroupVisible(visible: boolean): void {
    this.groupVisible = visible;
  }

  /**
   * 获取唯一键
   */
  @computed
  get uniqueKey(): string {
    return `${this.mapIndex}-${this.category}-${this.entityDataIdKey}`;
  }

  /**
   * 获取图标名称
   */
  @computed
  get iconName(): string {
    return this.entityInfo.entityInfo.pic;
  }

  /**
   * 获取统计信息
   */
  @computed
  get stats(): EntityInfoStats {
    return {
      uniqueKey: this.uniqueKey,
      category: this.category,
      entityDataIdKey: this.entityDataIdKey,
      entityInfo: this.entityInfo.entityInfo,
      visible: this.groupVisible,
      count: this.count,
      markedCount: this.markedCount,
      selectedCount: this.selectedCount,
      mapIndex: this.mapIndex,
    };
  }
}
