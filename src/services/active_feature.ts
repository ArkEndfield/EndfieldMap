import { ElectricPoleIdKey, EndfieldMapAdapter, MAP_EVENT } from '@endfieldmap/map-core';
import { dataService } from './data';
import type { ElectricPoleFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_feature';

/**
 * 初始化激活feature事件监听器
 * @param adapter 地图适配器
 */
export function initActiveFeatureEventListeners(adapter: EndfieldMapAdapter) {
  // 监听entity_click事件，设置active_feature
  adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
    if (adapter.mapController.selection.isSelecting) return;
    const { instance } = event;
    if (dataService.electricPoleDataService.isInElectricOperateMode && instance.entityInfo.entityInfo.point === ElectricPoleIdKey) {
      dataService.electricPoleDataService.connectElectricPole(instance as ElectricPoleFeature);
      return;
    }
    adapter.activeFeatureController.setActiveFeature(instance);
  });

  // 监听map_click事件，清除active_feature
  adapter.event.on(MAP_EVENT.MAP_CLICK, () => {
    adapter.activeFeatureController.clearActiveFeature();
  });
}
