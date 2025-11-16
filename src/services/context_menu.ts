import { EndfieldMapAdapter, MAP_EVENT } from "@endfieldmap/map-core";

export function initContextMenuEventListeners(adapter: EndfieldMapAdapter) {
  adapter.event.on(MAP_EVENT.CONNECTION_CONTEXT_MENU, (event) => {
    console.log('connection_context_menu', event);
  });

  adapter.event.on(MAP_EVENT.ENTITY_CONTEXT_MENU, (event) => {
    console.log('map_context_menu', event);
  });
}