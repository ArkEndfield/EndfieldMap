import type { LanguageLocale } from '@eftypes/language';
import { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useIsMobile } from '@/hooks/use_is_mobile';
import i18n from '@/i18n';
import { initActiveFeatureEventListeners } from '@/services/active_feature';
import { initCursorEventListeners } from '@/services/cursor';
import { dataService } from '@/services/data';
import { assetsHost } from '@/services/env';
import { loadingManager, LoadingStageId } from '@/services/loading';
import { sentryReporter } from '@/services/logger';
import { getLanguage } from '@/utils/language';
import { getAssetUrls } from '@/utils/url';

/**
 * 地图适配器 hook
 */
export function useMapAdapter(containerRef: React.RefObject<HTMLDivElement | null>) {
  const adapter = useRef<EndfieldMapAdapter | null>(null);
  const [adapterReactive, setAdapterReactive] = useState<EndfieldMapAdapter | null>(null);
  const isMobile = useIsMobile();
  /**
   * 初始化地图函数
   */
  const init = useCallback(async () => {
    if (adapter.current) return;

    try {
      // LOADING 初始化数据服务
      loadingManager.updateStageProgress(LoadingStageId.STORAGE, 10);
      await dataService.init();
      // LOADING
      loadingManager.completeStage(LoadingStageId.STORAGE);

      // LOADING
      loadingManager.updateStageProgress(LoadingStageId.MAP_ADAPTER, 20);
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

      // LOADING
      loadingManager.completeStage(LoadingStageId.MAP_ADAPTER);
    } catch (e) {
      loadingManager.setError(e as Error);
      console.error(e);
    }
  }, [containerRef]);

  const renderMap = useCallback((mapIdx?: MapIndex) => {
    if (adapter.current) {
      try {
        // LOADING
        loadingManager.updateStageProgress(LoadingStageId.MAP_RENDER, 10);
        // 从 localStorage 获取数据
        const data = dataService.getDataFromLocalStorage(mapIdx);
        const currentMap = data.currentMap;
        // 设置缩放
        adapter.current.mapController.setZoom(data.zoom);
        // 渲染地图
        adapter.current.renderMap(currentMap);

        // LOADING
        loadingManager.updateStageProgress(LoadingStageId.MAP_RENDER, 50);

        // 设置是否聚合
        adapter.current.setClusterEnable(data.enableCluster);
        // 设置鼠标悬停检测响应时间
        dataService.setHoverTime(data.hoverTime);
        // 设置标记过滤参数
        adapter.current.entityController.setMarkedFeatureFilter(data.filterMarked);
        // 渲染实体
        adapter.current
          .renderEntity(currentMap)
          .then(() => {
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

            // LOADING
            loadingManager.completeStage(LoadingStageId.MAP_RENDER);
            loadingManager.completeStage(LoadingStageId.ENTITY_RENDER);
          })
          .catch((e) => {
            loadingManager.setError(e as Error);
            console.error(e);
          });
        // 设置地图名称
        adapter.current.renderAreaName(getLanguage(i18n.language as LanguageLocale));
        // 渲染电线杆
        adapter.current.renderElectricPole(currentMap);
        // 渲染自定义标点
        adapter.current.renderCustomPoint(currentMap);
        // 设置地图中心
        adapter.current.mapController.setCenter(data.center);
        // 设置电线杆可见性
        adapter.current.electricPoleController.setZoneVisible(data.displayEletricPoleRange);
        // 设置电线杆范围可见性
        adapter.current.electricPoleController.setElectricPoleVisible(data.displayEletricPole);
        // 设置自定义标点可见性
        adapter.current.customPointController.setCustomPointVisible(data.displayCustomPoint);
      } catch (e) {
        loadingManager.setError(e as Error);
        console.error(e);
      }
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
    return () => {
      i18n.off('languageChanged');
    };
  }, []);

  useEffect(() => {
    if (adapterReactive && isMobile) {
      adapterReactive.setHoverFeatureEnable(true);
    }
  }, [isMobile, adapterReactive]);

  return {
    adapter: adapterReactive,
    renderMap,
  };
}
