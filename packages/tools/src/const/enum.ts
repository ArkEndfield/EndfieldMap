// 存储类型枚举
export enum StorageType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
}

// storage key enum
export enum StorageKey {
  MARKED_FEATURES = 'marked_features',
  LAYERS_VISIBILITY = 'layers_visibility',

  ELECTRIC_POLE = 'electric_pole',
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