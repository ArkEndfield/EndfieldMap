import type { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { ElectricPoleDataInstance, MAP_EVENT } from '@endfieldmap/map-core';
import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { audioService } from '@endfieldmap/web-components';

import { service } from '@/services';

/**
 * 初始化激活feature事件监听器
 * @param adapter 地图适配器
 */
export function initActiveFeatureEventListeners(adapter: EndfieldMapAdapter): () => void {
  // 监听entity_click事件，设置active_feature
  const disposeEntityClick = adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
    if (adapter.mapController.selection.isSelecting) return;
    const { instance } = event;

    // 电线杆特殊处理：在操作模式下进行连接操作
    if (service.dataService.mapDataService.electricPoleDataService.isInElectricOperateMode) {
      if (service.dataService.mapDataService.electricPoleDataService.isConnecting || service.dataService.mapDataService.electricPoleDataService.isCreating) {
        if (instance instanceof ElectricPoleDataInstance)
          service.dataService.mapDataService.electricPoleDataService.connectElectricPole(instance);
      }
      return;
    }

    // 自定义标点特殊处理
    if (service.dataService.mapDataService.customPointDataService.isInCustomPointOperateMode) {
      return;
    }

    adapter.activeFeatureController.setActiveFeature(instance);
    audioService.play(SoundType.TICK);
  });

  // 监听map_click事件，清除active_feature
  const disposeMapClick = adapter.event.on(MAP_EVENT.MAP_CLICK, (event) => {
    // 如果点击了实体，不清除active_feature
    if (event.hasHit) {
      return;
    }

    if (service.dataService.mapDataService.electricPoleDataService.isInElectricOperateMode) {
      return;
    }
    if (service.dataService.mapDataService.customPointDataService.isInCustomPointOperateMode) {
      return;
    }
    adapter.activeFeatureController.clearActiveFeature();
  });

  return () => {
    disposeEntityClick();
    disposeMapClick();
  };
}
