import { MapLibreAdapter } from '@endfieldmap/map-adapter-maplibre';
import { logger } from '@endfieldmap/tools';
import { useCallback, useEffect, useRef, useState } from 'react';

import { service } from '@/services/map-service';

interface MapInitState {
  adapter: MapLibreAdapter | null;
  loading: boolean;
  error: Error | null;
}

/**
 * 初始化地图适配器
 * 加载 map-service 数据并创建 MapLibreAdapter
 */
export function useMapInit(): MapInitState {
  const [state, setState] = useState<MapInitState>({
    adapter: null,
    loading: true,
    error: null,
  });
  const initRef = useRef(false);

  const init = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      await service.init();
      await service.dataService.mapDataService.initData();

      const { mapData, entityData } = service.dataService.mapDataService;
      if (!mapData || !entityData) {
        throw new Error('Failed to load map or entity data');
      }

      const assets = service.assetService.url;

      const adapter = new MapLibreAdapter({
        data: mapData,
        asset: assets,
      });

      await service.registerAdapter(adapter);
      adapter.entityController.loadData(entityData[0], entityData[1]);

      logger.info('[useMapInit] Tile URL:', adapter.mapController.tileUrlTemplate);

      setState({ adapter, loading: false, error: null });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error('[useMapInit] Failed to initialize', error);
      setState({ adapter: null, loading: false, error });
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return state;
}
