export const MAP_EVENT = {
    ZOOM_CHANGE: 'zoom:change',
    MAP_CLICK: 'map:click',
    MAP_CENTER_CHANGE: 'map:center:change',
    MAP_CONTEXT_MENU: 'map:context_menu',

    FEATURE_SELECT: 'feature:select',
    FEATURE_STATE_CHANGE: 'feature:state:change',

    CLUSTER_CLICK: 'cluster:click',
    ENTITY_CLICK: 'entity:click',
    ENTITY_CONTEXT_MENU: 'entity:context_menu',
    CONNECTION_CONTEXT_MENU: 'connection:context_menu',
    ENTITY_VISIBILITY_CHANGE: 'entity:visibility:change',
    ACTIVE_FEATURE_CHANGE: 'active:feature:change',
    SELECTION_START: 'selection:start',
} as const;