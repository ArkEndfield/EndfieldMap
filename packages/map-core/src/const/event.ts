export const MAP_EVENT = {
  ZOOM_CHANGE: 'zoom:change',
  MAP_CLICK: 'map:click',
  MAP_HOVER: 'map:hover',
  MAP_CENTER_CHANGE: 'map:center:change',
  MAP_CONTEXT_MENU: 'map:context_menu',
  MAP_MOVE_END: 'map:move_end',

  FEATURE_SELECT: 'feature:select',
  FEATURE_STATE_CHANGE: 'feature:state:change',

  CLUSTER_CLICK: 'cluster:click',
  ENTITY_CLICK: 'entity:click',
  ENTITY_CONTEXT_MENU: 'entity:context_menu',
  CONNECTION_CLICK: 'connection:click',
  CONNECTION_CONTEXT_MENU: 'connection:context_menu',
  ENTITY_VISIBILITY_CHANGE: 'entity:visibility:change',
  ACTIVE_FEATURE_CHANGE: 'active:feature:change',
  HOVER_FEATURE_CHANGE: 'hover:feature:change',
  HOVER_CONNECTION_CHANGE: 'hover:connection:change',
  SELECTION_START: 'selection:start',
  ELECTRIC_POLE_CHANGED: 'electric_pole:changed',
  CUSTOM_POINT_CHANGED: 'custom_point:changed',
} as const;
