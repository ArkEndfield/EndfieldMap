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
  /** 自定义标点数据 */
  CUSTOM_POINT = 'custom_point',
  /** 自定义标点类型可见性 */
  CUSTOM_POINT_VISIBILITY = 'custom_point_visibility',

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
  // 地图缩放
  MAP_ZOOM = 'map_zoom',
  // 地图视图位置
  MAP_VIEW_STATE = 'map_view_state',
  // 查看的地图
  MAP_CURRENT_MAP = 'map_current_map',

  // 20251125
  // 启用聚合
  CLUSTER_ENABLED = 'cluster_enabled',
  // 显示电线杆范围
  ELECTRIC_POLE_RANGE_DISPLAY = 'electric_pole_range_display',
  // 显示电线杆
  ELECTRIC_POLE_DISPLAY = 'electric_pole_display',
  // 显示自定义标点
  CUSTOM_POINT_DISPLAY = 'custom_point_display',
  // 标记筛选
  FILTER_MARKED = 'filter_marked',

  // 20251129
  // 鼠标悬停检测响应时间
  HOVER_TIME = 'hover_time',

  // 20251130
  // 是否开启调整视图防止超出屏幕
  MAP_ADJUST_VIEW = 'map_adjust_view',
}

/** 加载状态枚举 */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
