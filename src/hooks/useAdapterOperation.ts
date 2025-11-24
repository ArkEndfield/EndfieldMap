import type { LanguageLocale } from '@/@types/language';
import i18n from '@/i18n';
import { dataService } from '@/services/data';
import { getLanguage } from '@/utils/language';
import type { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';

export function useAdapterOperation(adapter: EndfieldMapAdapter) {
  const renderMap = (mapIdx?: MapIndex) => {
    if (adapter) {
      // 从 localStorage 获取数据
      const data = dataService.getDataFromLocalStorage(mapIdx);
      const currentMap = data.currentMap;
      // 设置缩放
      adapter.mapController.setZoom(data.zoom);
      // 渲染地图
      adapter.renderMap(currentMap);
      // 渲染实体
      adapter.renderEntity(currentMap).then(() => {
        // 显示entity
        if (adapter) {
          const storedEntityVisibility = dataService.entityDataService.entityVisibilityData;
          const storedFeatureMarked = dataService.entityDataService.featureMarkedData;
          if (adapter.entityController.validateLayerVisibility(storedEntityVisibility)) {
            adapter.entityController.importLayerVisibility(storedEntityVisibility);
          }
          if (adapter.entityController.validateMarkedFeatures(storedFeatureMarked)) {
            adapter.entityController.importMarkedFeatures(storedFeatureMarked);
          }
        }
      });
      // 设置地图名称
      adapter.renderAreaName(getLanguage(i18n.language as LanguageLocale));
      // 渲染电线杆
      adapter.renderElectricPole(currentMap);
      // 设置地图中心
      adapter.mapController.setCenter(data.center);
      dataService.electricPoleDataService.stopAllOperation();
    }
  };

  return {
    renderMap,
  };
}
