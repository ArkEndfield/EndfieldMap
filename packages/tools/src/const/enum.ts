// 存储类型枚举
export enum StorageType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
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

  // WASD_MOVE_SPEED 移动速度
  WASD_MOVE_SPEED = 'wasd_move_speed',
  // DevTools 状态
  DEV_TOOLS_STATE = 'dev_tools_state',

  // 20260302
  // 已读公告
  READ_ANNOUNCEMENT = 'read_announcement',
}

/** 加载状态枚举 */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
