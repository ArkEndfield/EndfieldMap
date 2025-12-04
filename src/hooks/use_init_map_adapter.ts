import { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { useCallback, useEffect, useRef, useState } from 'react';

import { LoadingStageId } from '@/const/loading';
import { useIsMobile } from '@/hooks/use_is_mobile';
import i18n from '@/i18n';
import { initActiveFeatureEventListeners } from '@/services/active_feature';
import { initCursorEventListeners } from '@/services/cursor';
import { DataService } from '@/services/data';
import { loadingManager } from '@/services/loading';
import { sentryReporter } from '@/services/logger';
import { getLanguage } from '@/utils/language';
import { getAssetUrls } from '@/utils/url';

/**
 * 地图适配器 hook
 */
export function useMapAdapter(containerRef: React.RefObject<HTMLDivElement | null>) {
  const adapter = useRef<EndfieldMapAdapter | null>(null);
  const dataService = useRef<DataService | null>(null);
  const [adapterReactive, setAdapterReactive] = useState<EndfieldMapAdapter | null>(null);
  const [dataServiceReactive, setDataServiceReactive] = useState<DataService | null>(null);
  const isMobile = useIsMobile();
  /**
   * 初始化地图函数
   */
  const init = useCallback(async () => {
    if (adapter.current) return;

    try {
      // LOADING 初始化数据服务
      loadingManager.updateStageProgress(LoadingStageId.STORAGE, 10);
      await DataService.initStorage();
      // LOADING
      loadingManager.completeStage(LoadingStageId.STORAGE);

      // LOADING
      loadingManager.updateStageProgress(LoadingStageId.MAP_ADAPTER, 20);

      adapter.current = new EndfieldMapAdapter({
        container: containerRef.current!,
        asset: getAssetUrls(),
        jsonLoader: DataService.jsonLoader,
        consolaReporter: sentryReporter,
      });

      setAdapterReactive(adapter.current);

      // 初始化鼠标指针样式监听器
      initCursorEventListeners(adapter.current);

      // LOADING
      loadingManager.completeStage(LoadingStageId.MAP_ADAPTER);
    } catch (e) {
      loadingManager.setError(e as Error);
      console.error(e);
    }
  }, [containerRef]);

  useEffect(() => {
    if (containerRef.current) {
      // 初始化地图
      init().then(async () => {
        loadingManager.updateStageProgress(LoadingStageId.MAP_RENDER, 10);
        dataService.current = await DataService.createInstance(adapter.current!);
        setDataServiceReactive(dataService.current);
        loadingManager.completeStage(LoadingStageId.MAP_RENDER);
        loadingManager.completeStage(LoadingStageId.ENTITY_RENDER);
        // 初始化激活feature事件监听器，用于设置和清除激活的feature
        initActiveFeatureEventListeners(adapter.current!, dataService.current);
      });
    }
  }, [init, containerRef]);

  useEffect(() => {
    // 监听语言变化
    i18n.on('languageChanged', () => {
      if (adapter.current) {
        adapter.current.renderAreaName(getLanguage(i18n.languages));
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
    dataService: dataServiceReactive,
  };
}
