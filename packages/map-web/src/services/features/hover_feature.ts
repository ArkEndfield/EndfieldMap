import { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { MAP_EVENT } from '@endfieldmap/map-core';

import { service } from '@/services';

/**
 * 初始化hover事件监听器
 * 监听 ENTITY_HOVER 和 CONNECTION_HOVER 事件，设置 hover 状态
 * @param adapter 地图适配器
 */
export function initHoverFeatureEventListeners(adapter: EndfieldMapAdapter) {
  // 监听 entity_hover 事件，设置 hover feature
  adapter.event.on(MAP_EVENT.ENTITY_HOVER, (event) => {
    if (
      service.dataService.mapDataService.customPointDataService.isCreating ||
      service.dataService.mapDataService.electricPoleDataService.isCreating ||
      service.dataService.mapDataService.electricPoleDataService.isDeletingConnection
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
      service.dataService.mapDataService.customPointDataService.isCreating ||
      service.dataService.mapDataService.electricPoleDataService.isCreating ||
      service.dataService.mapDataService.electricPoleDataService.isDeleting
    )
      return;

    const { feature, renderer } = event;

    const lastHoveredConnection = adapter.hoverConnectionController.hoverFeature;

    // 避免重复设置相同的 connection
    if (feature === lastHoveredConnection) {
      return;
    }

    if (feature && renderer) {
      adapter.hoverConnectionController.setHoverConnection(feature, renderer);
    } else {
      adapter.hoverConnectionController.clearHoverConnection();
    }
  });
}
