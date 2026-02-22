import { MapLibreAdapter } from '@endfieldmap/map-adapter-maplibre';
import { logger } from '@endfieldmap/tools';
import { useCallback, useEffect, useRef, useState } from 'react';

import { service } from '@/services/map-service';
import { initServiceEventBridge } from '@/services/service-event-bridge';

interface MapInitState {
  adapter: MapLibreAdapter | null;
  loading: boolean;
  error: Error | null;
}

const SYNC_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => {
      timer = setTimeout(() => resolve(undefined), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

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
      initServiceEventBridge();

      // Native uses in-memory RxDB storage, so data is lost on restart.
      // Try to sync user data but don't block forever — if network is slow
      // or unreachable, continue loading the map and let sync finish later.
      if (service.userService.auth.isLogin) {
        try {
          await withTimeout(service.userService.updateUidList(false), SYNC_TIMEOUT_MS);
          await service.userService.data.syncService.startSync();
          await withTimeout(
            service.userService.data.syncService.awaitInitialReplication(),
            SYNC_TIMEOUT_MS,
          );
        } catch (syncError) {
          logger.warn('[useMapInit] Sync failed, continuing without sync data', syncError);
        }
      }

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

      // Load entity data before registerAdapter, because registerAdapter triggers
      // initFromStorage() which imports marks — entity data must be loaded first.
      adapter.entityController.loadData(entityData[0], entityData[1]);
      await service.registerAdapter(adapter);

      const mapState = service.dataService.mapDataService.mapStateDataService;
      const initialMapId =
        mapState.currentMap.value === 'unselected' ? mapData.data[0]?.id : mapState.currentMap.value;
      if (initialMapId) {
        mapState.renderMap(initialMapId);
      }

      logger.info('[useMapInit] Initialized successfully', {
        tileUrl: adapter.mapController.tileUrlTemplate,
        mapId: adapter.mapController.dataManager.currentMapId,
        entityCount: adapter.entityController.currentVisibleInstances.length,
      });

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
