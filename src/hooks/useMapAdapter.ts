import { Language } from '@endfieldmap/tools';
import { useCallback, useEffect, useRef, useState } from 'react';

import { sentryReporter } from '@/services/logger';
import { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';
import { initActiveFeatureEventListeners } from '@/services/active_feature';
import { initCursorEventListeners } from '@/services/cursor';
import { dataService } from '@/services/data';
import { assetsHost } from '@/services/env';

const createFullUrl = (host: string = '', path: string) => {
  if (!host || !host.startsWith('http')) {
    return path;
  }
  return new URL(path, host).toString();
};

const getAssetUrls = (host?: string) => {
  return {
    mapImage: createFullUrl(host, '/images/map'),
    areaName: createFullUrl(host, '/data/map/area_name'),
    entityData: createFullUrl(host, '/data/entity'),
    entityImage: createFullUrl(host, '/images/entity'),
  };
};

export function useMapAdapter(containerRef: React.RefObject<HTMLDivElement | null>) {
  const adapter = useRef<EndfieldMapAdapter | null>(null);
  const [adapterReactive, setAdapterReactive] = useState<EndfieldMapAdapter | null>(null);

  const init = useCallback(async () => {
    if (adapter.current) return;

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

  const renderMap = useCallback(
    (mapIdx?: MapIndex) => {
      if (adapter.current) {
        const data = dataService.getDataFromLocalStorage(mapIdx);
        const currentMap = data.currentMap;
        adapter.current.mapController.setZoom(data.zoom);
        adapter.current.renderMap(currentMap);
        adapter.current.renderEntity(currentMap).then(() => {
          // 显示entity
          if (adapter.current) {
            // adapter.current.entityController.showEntity('int_trchest_common_normal');

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
        adapter.current.renderAreaName(Language.ZH_CN);
        adapter.current.renderElectricPole(currentMap);
        adapter.current.mapController.setCenter(data.center);
      }
    },
    [],
  );

  useEffect(() => {
    if (containerRef.current) {
      init().then(() => {
        renderMap();
      });
    }
  }, [init, containerRef, renderMap]);

  return {
    adapter: adapterReactive,
    renderMap
  };
}
