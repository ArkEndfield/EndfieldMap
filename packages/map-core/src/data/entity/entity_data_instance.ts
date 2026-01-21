import { BaseDataInstance } from '@endfieldmap/map-core/data/base';
import type { EntityData, EntityDataInstanceConfig, EntityInfoData } from '@endfieldmap/map-core/types/entity';
import { xyz2crd } from '@endfieldmap/tools';
import { computed, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * Entity数据实例
 * 负责管理单个Entity的数据和状态
 */
export class EntityDataInstance extends BaseDataInstance<EntityData> {
  /** Entity信息 */
  @computed
  get entityInfo(): EntityInfoData {
    return this._data.entityInfo!;
  }

  constructor(config: EntityDataInstanceConfig) {
    super({
      data: config.data,
      mapIndex: config.mapIndex,
    });
  }

  /**
   * 获取坐标
   */
  @computed
  get coordinates(): Coordinate {
    return xyz2crd(this._data.position, this.mapIndex);
  }

  /**
   * 获取分类
   */
  @computed
  get category(): string {
    return this.entityInfo.category;
  }

  /**
   * 获取图标名称
   */
  @computed
  get iconName(): string {
    return this.entityInfo.entityInfo.pic;
  }

  /**
   * 获取是否默认隐藏
   */
  @computed
  get defaultHide(): boolean {
    return this._data.defaultHide ?? false;
  }

  /**
   * 获取奖励ID
   */
  @computed
  get rewardId(): string | undefined {
    return this._data.properties.reward_id;
  }

  /**
   * 获取副本系列ID
   */
  @computed
  get systemInstKey(): string | undefined {
    return this._data.properties.system_inst_key;
  }

  /**
   * 是否在任务后隐藏
   */
  @computed
  get isHideAfterMission(): boolean {
    return !!this._data.properties.is_hide_after_mission;
  }

  /**
   * 是否在任务前隐藏
   */
  @computed
  get isHideBeforeMission(): boolean {
    return !!this._data.properties.is_hide_before_mission;
  }
}
