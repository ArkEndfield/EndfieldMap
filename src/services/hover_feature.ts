import { EndfieldMapAdapter, MAP_EVENT, type MapFeature } from '@endfieldmap/map-core';
import type { DataService } from '@/services/data';

/**
 * 初始化hover事件监听器
 * 监听 ENTITY_HOVER 和 CONNECTION_HOVER 事件，设置 hover 状态
 * @param adapter 地图适配器
 */
export function initHoverFeatureEventListeners(adapter: EndfieldMapAdapter, dataService: DataService) {
  // 用于跟踪当前 hover 的 feature，避免重复设置
  let lastHoveredFeature: MapFeature | null = null;
  let lastHoveredConnection: unknown = null;

  // 监听 entity_hover 事件，设置 hover feature
  adapter.event.on(MAP_EVENT.ENTITY_HOVER, (event) => {
    if (
      dataService.customPointDataService.isCreating ||
      dataService.electricPoleDataService.isCreating ||
      dataService.electricPoleDataService.isDeletingConnection
    )
      return;

    const { instance, coordinate } = event;

    // 避免重复设置相同的 feature
    if (instance === lastHoveredFeature) {
      return;
    }
    lastHoveredFeature = instance;

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

    // 避免重复设置相同的 connection
    if (feature === lastHoveredConnection) {
      return;
    }
    lastHoveredConnection = feature;

    if (feature && layer) {
      adapter.hoverConnectionController.setHoverConnection(feature, layer);
    } else {
      adapter.hoverConnectionController.clearHoverConnection();
    }
  });
}
