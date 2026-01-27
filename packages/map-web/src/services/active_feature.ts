import type { ElectricPoleDataInstance } from '@endfieldmap/map-core';
import { ElectricPoleKey, type EndfieldMapAdapter, MAP_EVENT } from '@endfieldmap/map-core';

import type { DataService } from '@/services/data';

/**
 * 初始化激活feature事件监听器
 * @param adapter 地图适配器
 */
export function initActiveFeatureEventListeners(adapter: EndfieldMapAdapter, dataService: DataService) {
  // 监听entity_click事件，设置active_feature
  adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
    if (adapter.mapController.selection.isSelecting) return;
    const { instance } = event;

    // 电线杆特殊处理：在操作模式下进行连接操作
    if (dataService.electricPoleDataService.isInElectricOperateMode) {
      if (dataService.electricPoleDataService.isConnecting || dataService.electricPoleDataService.isCreating) {
        if (instance.entityInfo?.category === ElectricPoleKey)
          dataService.electricPoleDataService.connectElectricPole(instance as unknown as ElectricPoleDataInstance);
      }
      return;
    }

    // 自定义标点特殊处理
    if (dataService.customPointDataService.isInCustomPointOperateMode) {
      return;
    }

    adapter.activeFeatureController.setActiveFeature(instance);
  });

  // 监听map_click事件，清除active_feature
  adapter.event.on(MAP_EVENT.MAP_CLICK, (event) => {
    // 如果点击了实体，不清除active_feature
    if (event.hasHit) {
      return;
    }

    if (dataService.electricPoleDataService.isInElectricOperateMode) {
      return;
    }
    if (dataService.customPointDataService.isInCustomPointOperateMode) {
      return;
    }
    adapter.activeFeatureController.clearActiveFeature();
  });
}
