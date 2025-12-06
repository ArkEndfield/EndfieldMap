import { EndfieldMapAdapter, MAP_EVENT } from '@endfieldmap/map-core';

import type { DataService } from '@/services/data';

/**
 * 初始化hover事件监听器
 * 监听 ENTITY_HOVER 和 CONNECTION_HOVER 事件，设置 hover 状态
 * @param adapter 地图适配器
 */
export function initHoverFeatureEventListeners(adapter: EndfieldMapAdapter, dataService: DataService) {
  // 监听 entity_hover 事件，设置 hover feature
  adapter.event.on(MAP_EVENT.ENTITY_HOVER, (event) => {
    if (
      dataService.customPointDataService.isCreating ||
      dataService.electricPoleDataService.isCreating ||
      dataService.electricPoleDataService.isDeletingConnection
    )
      return;

    const { instance, coordinate } = event;
    const lastHoveredFeature = adapter.hoverFeatureController.hoverFeature;
    // 避免重复设置相同的 feature
    if (instance === lastHoveredFeature) {
      return;
    }

    if (instance) {
      adapter.hoverFeatureController.setHoverFeature(instance, coordinate);
    } else {
      adapter.hoverFeatureController.clearHoverFeature();
    }
  });

  // 监听 connection_hover 事件，设置 hover connection
  adapter.event.on(MAP_EVENT.CONNECTION_HOVER, (event) => {
    if (
      dataService.customPointDataService.isCreating ||
      dataService.electricPoleDataService.isCreating ||
      dataService.electricPoleDataService.isDeleting
    )
      return;

    const { feature, layer } = event;

    const lastHoveredConnection = adapter.hoverConnectionController.hoverFeature;

    // 避免重复设置相同的 connection
    if (feature === lastHoveredConnection) {
      return;
    }

    if (feature && layer) {
      adapter.hoverConnectionController.setHoverConnection(feature, layer);
    } else {
      adapter.hoverConnectionController.clearHoverConnection();
    }
  });
}
