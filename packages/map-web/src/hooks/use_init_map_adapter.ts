import { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { useTranslation } from '@endfieldmap/map-service';
import { useIsMobile } from '@endfieldmap/web-components';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MapService } from '@/services/map';

/**
 * 地图适配器 hook
 */
export function useMapAdapter(containerRef: React.RefObject<HTMLDivElement | null>) {
  const adapter = useRef<EndfieldMapAdapter | null>(null);
  const [adapterReactive, setAdapterReactive] = useState<EndfieldMapAdapter | null>(null);
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  /*
   * 初始化地图函数
   */
  const init = useCallback(async () => {
    if (adapter.current || !containerRef.current) return;

    const mapService = new MapService(containerRef.current!);
    const data = await mapService.init();
    if (!data) return;
    const { adapter: efAdapter } = data;
    adapter.current = efAdapter;
    setAdapterReactive(efAdapter);
  }, [containerRef]);

  useEffect(() => {
    if (containerRef.current) {
      // 初始化地图
      init();
    }
  }, [init, containerRef]);

  useEffect(() => {
    // 监听语言变化
    const handleLanguageChange = () => {
      if (adapter.current) {
        adapter.current.renderAreaName();
      }
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    if (adapterReactive && isMobile) {
      adapterReactive.setHoverFeatureEnable(true);
    }
  }, [isMobile, adapterReactive]);

  return {
    adapter: adapterReactive,
  };
}
