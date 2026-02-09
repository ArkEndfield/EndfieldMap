import { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { useEffect, useRef, useState } from 'react';

import { useIsMobile } from '@/hooks/use_is_mobile';
import i18n from '@/i18n';
import type { MapDataService } from '@/services/data/map';
import { MapService } from '@/services/map';

/**
 * 地图适配器 hook
 */
export function useMapAdapter(containerRef: React.RefObject<HTMLDivElement | null>) {
  const adapter = useRef<EndfieldMapAdapter | null>(null);
  const mapDataService = useRef<MapDataService | null>(null);
  const [adapterReactive, setAdapterReactive] = useState<EndfieldMapAdapter | null>(null);
  const [mapDataServiceReactive, setMapDataServiceReactive] = useState<MapDataService | null>(null);
  const [mapServiceReactive, setMapServiceReactive] = useState<MapService | null>(null);
  const isMobile = useIsMobile();
  /**
   * 初始化地图函数
   */
  const init = async () => {
    if (adapter.current || !containerRef.current) return;

    const mapService = MapService.getInstance(containerRef.current!);
    const data = await mapService.init();
    if (!data) return;
    const { adapter: efAdapter, mapDataService: efDataService } = data;
    adapter.current = efAdapter;
    mapDataService.current = efDataService;
    setAdapterReactive(efAdapter);
    setMapDataServiceReactive(efDataService);
    setMapServiceReactive(mapService);
  };

  useEffect(() => {
    if (containerRef.current) {
      // 初始化地图
      init();
    }
  }, [init, containerRef]);

  useEffect(() => {
    // 监听语言变化
    i18n.on('languageChanged', () => {
      if (adapter.current) {
        adapter.current.renderAreaName();
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
    mapDataService: mapDataServiceReactive,
    mapService: mapServiceReactive,
  };
}
