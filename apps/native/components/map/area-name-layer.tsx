import { pixelToLngLat } from '@endfieldmap/map-adapter-maplibre';
import type { MapBaseRegionData, OverrideRegionData } from '@endfieldmap/map-core';
import { ShapeSource, SymbolLayer, SymbolLayerStyle } from '@maplibre/maplibre-react-native';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/context/adapter';

const ZOOM_THRESHOLD = 3;

function regionsToGeoJSON(
  regions: (MapBaseRegionData | OverrideRegionData)[],
  mapId: string,
  mapDataManager: { xyz2crd: (pos: { x: number; y: number; z: number }, mapId: string) => [number, number] },
  translateName: (name: string) => string
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const region of regions) {
    if (!region.name || !region.position) continue;
    const crd = mapDataManager.xyz2crd(region.position, mapId);
    const lngLat = pixelToLngLat(crd);
    features.push({
      type: 'Feature',
      id: `${mapId}-${region.saveId}`,
      geometry: { type: 'Point', coordinates: lngLat },
      properties: { name: translateName(region.name) },
    });
  }
  return { type: 'FeatureCollection', features };
}

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/**
 * 地图符号层字体栈。服务端 glyph URL 只认单字体路径，故仅用一种字体。
 * 区域名多为简体中文时用 SC_Regular 可减少缺字；若需繁体显示可改为 HarmonyOS_Sans_TC_Regular。
 */
export const MAP_SYMBOL_FONT_STACK = ['HarmonyOS_Sans_SC_Regular'] as const;

const AREA_TEXT_STYLE: SymbolLayerStyle = {
  textField: ['get', 'name'],
  textFont: ['literal', [...MAP_SYMBOL_FONT_STACK]],
  textSize: 16,
  textColor: '#ffffff',
  textHaloColor: '#000000',
  textHaloWidth: 2,
  textHaloBlur: 0.5,
  textAnchor: 'center' as const,
  textAllowOverlap: true,
  textIgnorePlacement: true,
};

export const AreaNameLayer = observer(function AreaNameLayer() {
  const { t } = useTranslation('lang');
  const adapter = useAdapter();
  const mapController = adapter.mapController;
  const mapDataManager = mapController.dataManager;
  const currentMap = mapDataManager.currentMap;
  const currentMapId = mapDataManager.currentMapId;

  const translateName = useCallback(
    (name: string): string => t(name, { defaultValue: name }),
    [t]
  );

  const baseGeoJSON = useMemo(() => {
    if (!currentMap?.regions) return EMPTY_FC;
    return regionsToGeoJSON(currentMap.regions, currentMapId, mapDataManager, translateName);
  }, [currentMap, currentMapId, mapDataManager, translateName]);

  const overrideGeoJSON = useMemo(() => {
    if (!currentMap?.regions) return EMPTY_FC;
    const overrides = currentMap.regions.flatMap((r) => r.overrides);
    return regionsToGeoJSON(overrides, currentMapId, mapDataManager, translateName);
  }, [currentMap, currentMapId, mapDataManager, translateName]);

  return (
    <>
      <ShapeSource id="areaNameBaseSource" shape={baseGeoJSON}>
        <SymbolLayer
          id="areaNameBaseLayer"
          maxZoomLevel={ZOOM_THRESHOLD}
          style={AREA_TEXT_STYLE}
        />
      </ShapeSource>
      <ShapeSource id="areaNameOverrideSource" shape={overrideGeoJSON}>
        <SymbolLayer
          id="areaNameOverrideLayer"
          minZoomLevel={ZOOM_THRESHOLD}
          style={AREA_TEXT_STYLE}
        />
      </ShapeSource>
    </>
  );
});
