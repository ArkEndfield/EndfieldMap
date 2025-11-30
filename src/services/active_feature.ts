import { ElectricPoleKey, EndfieldMapAdapter, MAP_EVENT } from '@endfieldmap/map-core';
import type { ElectricPoleFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_feature';

import { dataService } from './data';

/**
 * 初始化激活feature事件监听器
 * @param adapter 地图适配器
 */
export function initActiveFeatureEventListeners(adapter: EndfieldMapAdapter) {
  // 监听entity_click事件，设置active_feature
  adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
    if (adapter.mapController.selection.isSelecting) return;
    const { instance } = event;

    // 电线杆特殊处理：在操作模式下进行连接操作
    if (
      dataService.electricPoleDataService.isInElectricOperateMode &&
      instance.entityInfo.category === ElectricPoleKey
    ) {
      dataService.electricPoleDataService.connectElectricPole(instance as ElectricPoleFeature);
      return;
    }

    // 自定义标点特殊处理
    if (dataService.customPointDataService.isInCustomPointOperateMode) {
      return;
    }

    adapter.activeFeatureController.setActiveFeature(instance);
  });

  // 监听map_click事件，清除active_feature
  adapter.event.on(MAP_EVENT.MAP_CLICK, () => {
    if (dataService.electricPoleDataService.isInElectricOperateMode) {
      return;
    }
    if (dataService.customPointDataService.isInCustomPointOperateMode) {
      return;
    }
    adapter.activeFeatureController.clearActiveFeature();
  });
}
