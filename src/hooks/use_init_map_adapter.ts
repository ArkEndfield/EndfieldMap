import { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { useEffect, useRef, useState } from 'react';

import { useIsMobile } from '@/hooks/use_is_mobile';
import i18n from '@/i18n';
import { DataService } from '@/services/data';
import { MapService } from '@/services/map';
import { getLanguage } from '@/utils/language';

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
  const init = async () => {
    if (adapter.current || !containerRef.current) return;

    const mapService = MapService.getInstance(containerRef.current!);
    const data = await mapService.init();
    if (!data) return;
    const { adapter: efAdapter, dataService: efDataService } = data;
    adapter.current = efAdapter;
    dataService.current = efDataService;
    setAdapterReactive(efAdapter);
    setDataServiceReactive(efDataService);
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
