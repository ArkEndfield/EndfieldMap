import { EndfieldMapAdapter, MAP_EVENT } from "@endfieldmap/map-core";

export function initActiveFeatureEventListeners(adapter: EndfieldMapAdapter) {
  // 监听entity_click事件，设置active_feature
  adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
    if (adapter.mapController.selection.isSelecting) return;
    const { instance } = event;
    adapter.activeFeatureController.setActiveFeature(instance);
  });

  // 监听map_click事件，清除active_feature
  adapter.event.on(MAP_EVENT.MAP_CLICK, () => {
    adapter.activeFeatureController.clearActiveFeature();
  });
}