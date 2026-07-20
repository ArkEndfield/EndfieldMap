import { BaseDataInstance } from '@endfieldmap/map-core/data/base';
import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';
import type { EntityData, EntityDataInstanceConfig, EntityInfoData } from '@endfieldmap/map-core/types/entity';
import { computed } from 'mobx';

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
      mapId: config.mapId,
      mapDataManager: config.mapDataManager,
    });
  }

  /**
   * 获取坐标
   */
  @computed
  get coordinates(): MapCoordinate {
    return this.mapDataManager.xyz2crd(this._data.position, this.mapId);
  }

  /**
   * 获取所属地图 level id
   *
   * 与 `data.mapLevelId` 等价，但只读单个字段。`data` 会对整个 `_data` 做 `toJS`
   * 深拷贝，在渲染筛选这类逐实体的热路径上代价极高，那里一律用这个 getter。
   */
  @computed
  get mapLevelId(): string | undefined {
    return this._data.mapLevelId;
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
