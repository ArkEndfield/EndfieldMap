// 存储类型枚举
export enum StorageType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
}

// storage key enum
export enum StorageKey {
  /** 标记已获取的数据 */
  MARKED_FEATURES = 'marked_features',
  /** 筛选显示类型标点的数据 */
  LAYERS_VISIBILITY = 'layers_visibility',

  /** 电线杆数据 */
  ELECTRIC_POLE = 'electric_pole',

  /** ChestReward */
  CHEST_REWARD = 'chest_reward',
  /** ItemData */
  ITEM_DATA = 'item_data',
  /** DungeonSeries */
  DUNGEON_SERIES = 'dungeon_series',
  /** Guide */
  GUIDE = 'guide',
}

// local storage type enum
export enum LocalStorageKey {
  MAP_ZOOM = 'map_zoom',
  MAP_VIEW_STATE = 'map_view_state',
  MAP_CURRENT_MAP = 'map_current_map',
}

/** 加载状态枚举 */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
