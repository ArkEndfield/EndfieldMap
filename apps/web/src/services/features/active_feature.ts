import type { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { ElectricPoleDataInstance, EntityDataInstance, MAP_EVENT } from '@endfieldmap/map-core';
import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { audioService } from '@endfieldmap/web-components';

import { service } from '@/services';
import uiManager from '@/services/ui_manager';

/**
 * 初始化激活feature事件监听器
 * @param adapter 地图适配器
 */
export function initActiveFeatureEventListeners(adapter: EndfieldMapAdapter): () => void {
  // 监听entity_click事件，设置active_feature
  const disposeEntityClick = adapter.event.on(MAP_EVENT.ENTITY_CLICK, (event) => {
    if (adapter.mapController.selection.isSelecting) return;
    const { instance } = event;

    // 电线杆特殊处理：在操作模式下进行连接操作（移动交互由 hover 拖拽承担，不在此处理）
    if (service.dataService.mapDataService.electricPoleDataService.isInElectricOperateMode) {
      const epService = service.dataService.mapDataService.electricPoleDataService;
      if (epService.isConnecting || epService.isCreating) {
        if (instance instanceof ElectricPoleDataInstance) epService.connectElectricPole(instance);
      }
      return;
    }

    // 自定义标点特殊处理
    if (service.dataService.mapDataService.customPointDataService.isInCustomPointOperateMode) {
      return;
    }

    adapter.activeFeatureController.setActiveFeature(instance);
    audioService.play(SoundType.TICK);

    // 点击不属于当前分层层级的标点时，打开其所在的分层地图；
    // 视图动画中心传标点自身坐标，保证刚打开的详情弹窗不被甩出屏幕
    if (uiManager.enableTier.value && instance instanceof EntityDataInstance) {
      const tierDataManager = adapter.tierController.tierDataManager;
      const region = tierDataManager.getTierRegion(instance.mapRegionId);
      if (
        region &&
        (region.tierId !== tierDataManager.activeTier || region.subTierId !== tierDataManager.activeSubTier)
      ) {
        const { x, z } = instance.position;
        void adapter.tierController.renderTier(region.mapId, [x, z], region.tierId, region.subTierId);
      }
    }
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
