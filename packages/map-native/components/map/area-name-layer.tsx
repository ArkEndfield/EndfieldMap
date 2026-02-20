import { pixelToLngLat } from '@endfieldmap/map-adapter-maplibre';
import type { MapLibreAdapter } from '@endfieldmap/map-adapter-maplibre';
import type { MapBaseRegionData, OverrideRegionData } from '@endfieldmap/map-core/types';
import { logger } from '@endfieldmap/tools';
import { ShapeSource, SymbolLayer } from '@maplibre/maplibre-react-native';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo } from 'react';

import { useAdapter } from '@/context/adapter';
import { service } from '@/services/map-service';

interface AreaNameGeoFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    name: string;
  };
}

/**
 * 将区域数据转为 GeoJSON FeatureCollection
 */
function buildAreaNameGeoJSON(
  regions: (MapBaseRegionData | OverrideRegionData)[],
  mapId: string,
  mapDataManager: MapLibreAdapter['mapController']['dataManager'],
  translateName: (name: string) => string
): GeoJSON.FeatureCollection {
  const features: AreaNameGeoFeature[] = [];

  for (const region of regions) {
    if (!region.name || !region.position) continue;

    const crd = mapDataManager.xyz2crd(region.position, mapId);
    const lngLat = pixelToLngLat(crd);
    const translatedName = translateName(region.name);

    features.push({
      type: 'Feature',
      id: `${mapId}-${region.saveId}`,
      geometry: {
        type: 'Point',
        coordinates: lngLat,
      },
      properties: {
        name: translatedName,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * 区域名称图层组件
 * 根据当前缩放级别显示大区域或小区域名称
 */
export const AreaNameLayer = observer(function AreaNameLayer() {
  const adapter = useAdapter();
  const mapController = adapter.mapController;
  const mapDataManager = mapController.dataManager;
  const currentMap = mapDataManager.currentMap;
  const currentMapId = mapDataManager.currentMapId;
  // 直接观察 view.currentZoom，确保 MobX 能正确追踪变化
  const viewZoom = mapController.view.currentZoom;
  const currentZoom = viewZoom ?? mapController.zoomConfig.default;

  const regionsToShow = useMemo(() => {
    if (!currentMap?.regions) {
      logger.debug('[AreaNameLayer] No regions found for map:', currentMapId);
      return [];
    }

    // zoom >= 3 显示小区域（overrides），否则显示大区域（regions）
    const regions = currentZoom >= 3
      ? currentMap.regions.flatMap((region) => region.overrides)
      : currentMap.regions;

    logger.debug('[AreaNameLayer] Regions to show:', {
      mapId: currentMapId,
      zoom: currentZoom,
      count: regions.length,
      type: currentZoom >= 3 ? 'overrides' : 'base',
    });

    return regions;
  }, [currentMap, currentZoom, currentMapId]);

  const translateName = useCallback(
    (name: string): string => {
      return service.translate(name, { ns: 'lang', defaultValue: name });
    },
    []
  );

  const geoJSON = useMemo(
    () => {
      const result = buildAreaNameGeoJSON(
        regionsToShow,
        currentMapId,
        mapDataManager,
        translateName
      );
      logger.debug('[AreaNameLayer] GeoJSON built:', {
        featureCount: result.features.length,
        features: result.features.map((f) => ({
          id: f.id,
          name: f.properties?.name,
          coords: f.geometry?.type === 'Point' ? f.geometry.coordinates : undefined,
        })),
      });
      return result;
    },
    [regionsToShow, currentMapId, mapDataManager, translateName]
  );

  useEffect(() => {
    logger.info('[AreaNameLayer] Component rendered:', {
      mapId: currentMapId,
      zoom: currentZoom,
      regionsCount: regionsToShow.length,
      geoJSONFeatures: geoJSON.features.length,
    });
  }, [currentMapId, currentZoom, regionsToShow.length, geoJSON.features.length]);

  if (regionsToShow.length === 0) {
    logger.debug('[AreaNameLayer] No regions to show, returning null');
    return null;
  }

  return (
    <ShapeSource id="areaNameSource" shape={geoJSON}>
      <SymbolLayer
        id="areaNameLayer"
        style={{
          textField: ['get', 'name'],
          textFont: ['literal', ['Arial Unicode MS Regular', 'Arial Regular']],
          textSize: 16,
          textColor: '#ffffff',
          textHaloColor: '#000000',
          textHaloWidth: 2,
          textHaloBlur: 0.5,
          textAnchor: 'center',
          textOffset: [0, -1.5],
          textAllowOverlap: true,
          textIgnorePlacement: true,
        }}
      />
    </ShapeSource>
  );
});
