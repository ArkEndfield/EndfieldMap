import { useCallback, useEffect, useRef, useState } from 'react';

import { sentryReporter } from '@/services/logger';
import { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';
import { initActiveFeatureEventListeners } from '@/services/active_feature';
import { initCursorEventListeners } from '@/services/cursor';
import { dataService } from '@/services/data';
import { assetsHost } from '@/services/env';
import i18n from '@/i18n';
import { getLanguage } from '@/utils/language';
import type { LanguageLocale } from '@/types/language';
import { getAssetUrls } from '@/utils/url';

/**
 * 地图适配器 hook
 */
export function useMapAdapter(containerRef: React.RefObject<HTMLDivElement | null>) {
  const adapter = useRef<EndfieldMapAdapter | null>(null);
  const [adapterReactive, setAdapterReactive] = useState<EndfieldMapAdapter | null>(null);

  /**
   * 初始化地图函数
   */
  const init = useCallback(async () => {
    if (adapter.current) return;

    // 初始化数据服务
    await dataService.init();

    adapter.current = new EndfieldMapAdapter({
      container: containerRef.current!,
      asset: getAssetUrls(assetsHost),
      jsonLoader: dataService.jsonLoader,
      consolaReporter: sentryReporter,
    });

    setAdapterReactive(adapter.current);

    // 注册adapter data
    dataService.registerAdapter(adapter.current);

    // 初始化激活feature事件监听器，用于设置和清除激活的feature
    initActiveFeatureEventListeners(adapter.current);

    // 初始化鼠标指针样式监听器
    initCursorEventListeners(adapter.current);
  }, [containerRef]);

  const renderMap = useCallback((mapIdx?: MapIndex) => {
    if (adapter.current) {
      // 从 localStorage 获取数据
      const data = dataService.getDataFromLocalStorage(mapIdx);
      const currentMap = data.currentMap;
      // 设置缩放
      adapter.current.mapController.setZoom(data.zoom);
      // 渲染地图
      adapter.current.renderMap(currentMap);
      // 渲染实体
      adapter.current.renderEntity(currentMap).then(() => {
        // 显示entity
        if (adapter.current) {
          const storedEntityVisibility = dataService.entityDataService.entityVisibilityData;
          const storedFeatureMarked = dataService.entityDataService.featureMarkedData;
          if (adapter.current.entityController.validateLayerVisibility(storedEntityVisibility)) {
            adapter.current.entityController.importLayerVisibility(storedEntityVisibility);
          }
          if (adapter.current.entityController.validateMarkedFeatures(storedFeatureMarked)) {
            adapter.current.entityController.importMarkedFeatures(storedFeatureMarked);
          }
        }
      });
      // 设置地图名称
      adapter.current.renderAreaName(getLanguage(i18n.language as LanguageLocale));
      // 渲染电线杆
      adapter.current.renderElectricPole(currentMap);
      // 设置地图中心
      adapter.current.mapController.setCenter(data.center);
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      // 初始化地图
      init().then(() => {
        renderMap();
      });
    }
  }, [init, containerRef, renderMap]);

  useEffect(() => {
    // 监听语言变化
    i18n.on('languageChanged', () => {
      if (adapter.current) {
        adapter.current.renderAreaName(getLanguage(i18n.language as LanguageLocale));
      }
    });
  }, []);

  return {
    adapter: adapterReactive,
    renderMap,
  };
}
