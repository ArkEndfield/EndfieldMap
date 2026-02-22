import { lngLatToPixel, pixelToLngLat } from '@endfieldmap/map-adapter-maplibre';
import type { MapLibreAdapter } from '@endfieldmap/map-adapter-maplibre';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import { Camera, Logger, MapView, setAccessToken, type CameraRef } from '@maplibre/maplibre-react-native';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useAdapter } from '@/context/adapter';

import { AreaNameLayer } from './area-name-layer';
import { EntityMarkerLayer, type CameraPositionRef } from './entity-marker-layer';

setAccessToken(null);
Logger.setLogLevel('warning');
Logger.setLogCallback((log) => {
  const msg = log.message;
  if (
    msg.includes('bitmap decoding') ||
    msg.includes('Failed to load tile') ||
    msg.includes('Failed to load glyph') ||
    (msg.includes('Request failed due to a permanent error') && msg.includes('Canceled'))
  ) {
    return true;
  }
  return false;
});

function deriveGlyphsUrl(mapImageUrl: string): string {
  const base = mapImageUrl.replace(/\/images\/map\/?$/, '');
  return `${base}/fonts/webgis/{fontstack}/{range}.pbf`;
}

function buildMapStyle(
  tileUrl: string,
  glyphsUrl: string,
  minZoom: number,
  maxZoom: number
): Record<string, unknown> {
  return {
    version: 8 as const,
    name: 'GameMap',
    glyphs: glyphsUrl,
    sources: {
      gameMapTiles: {
        type: 'raster' as const,
        tiles: [tileUrl],
        tileSize: 256,
        minzoom: Math.floor(minZoom),
        maxzoom: Math.ceil(maxZoom),
      },
    },
    layers: [
      {
        id: 'gameMapLayer',
        type: 'raster' as const,
        source: 'gameMapTiles',
        paint: { 'raster-opacity': 1 },
      },
    ],
  };
}

interface GameMapViewProps {
  onEntityPress?: (instance: EntityDataInstance) => void;
}

function GameMapViewInner({
  adapter,
  currentMapId,
  onEntityPress,
}: {
  adapter: MapLibreAdapter;
  currentMapId: string;
  onEntityPress?: (instance: EntityDataInstance) => void;
}) {
  const cameraRef = useRef<CameraRef>(null);
  const mapReady = useRef(false);
  const cameraPositionRef = useRef<CameraPositionRef>({
    center: undefined,
    zoom: undefined,
  });

  const mapController = adapter.mapController;
  const view = mapController.view;
  const zoomConfig = mapController.zoomConfig;
  const tileUrl = mapController.tileUrlTemplate;
  const glyphsUrl = useMemo(() => deriveGlyphsUrl(adapter.asset.mapImage), [adapter.asset.mapImage]);

  const mapStyle = useMemo(() => {
    if (!tileUrl) {
      return { version: 8 as const, name: 'Empty', glyphs: glyphsUrl, sources: {}, layers: [] };
    }
    return buildMapStyle(tileUrl, glyphsUrl, zoomConfig.min, zoomConfig.max);
  }, [tileUrl, glyphsUrl, zoomConfig.min, zoomConfig.max]);

  const defaultCenter = useMemo(() => {
    const mapData = mapController.dataManager.getMapData(currentMapId);
    if (!mapData) return [0, 0] as [number, number];
    return pixelToLngLat(mapController.dataManager.getMapCenter(currentMapId));
  }, [mapController, currentMapId]);

  const initialCenter = useMemo(() => {
    return view.currentCenterLngLat ?? defaultCenter;
  }, [defaultCenter, view.currentCenterLngLat]);

  const initialZoom = useMemo(() => {
    return view.currentZoom ?? zoomConfig.default;
  }, [zoomConfig.default, view.currentZoom]);

  useEffect(() => {
    view.syncFromMap(initialCenter, initialZoom);
    cameraPositionRef.current = { center: initialCenter, zoom: initialZoom };
  }, [view, initialCenter, initialZoom]);

  useEffect(() => {
    if (!cameraRef.current) return;
    const center = view.currentCenterLngLat ?? defaultCenter;
    const zoom = view.currentZoom ?? zoomConfig.default;
    cameraRef.current.setCamera({
      centerCoordinate: center,
      zoomLevel: zoom,
      animationDuration: 0,
    });
    cameraPositionRef.current = { center, zoom };
    // 仅在地图切换时应用相机位置，不随 pan/zoom 重复执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMapId]);

  useEffect(() => {
    const timer = setInterval(() => {
      const animation = view.consumeAnimation();
      if (!animation || !cameraRef.current) return;

      const cam = cameraRef.current;
      const duration = animation.duration ?? 500;

      if (animation.center && animation.zoom !== undefined) {
        cam.setCamera({
          centerCoordinate: animation.center,
          zoomLevel: animation.zoom,
          animationDuration: duration,
        });
        cameraPositionRef.current.center = animation.center;
        cameraPositionRef.current.zoom = animation.zoom;
      } else if (animation.zoom !== undefined) {
        cam.zoomTo(animation.zoom, duration);
        cameraPositionRef.current.zoom = animation.zoom;
      } else if (animation.center) {
        cam.moveTo(animation.center, duration);
        cameraPositionRef.current.center = animation.center;
      }
    }, 100);
    return () => clearInterval(timer);
  }, [view]);

  const handleRegionDidChange = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point>) => {
      const coords = feature.geometry.coordinates as [number, number];
      const zoom = (feature.properties?.zoomLevel as number) ?? initialZoom;
      cameraPositionRef.current = { center: coords, zoom };
      view.syncFromMap(coords, zoom);
      adapter.event.fire(MAP_EVENT.ZOOM_CHANGE, zoom);
      adapter.event.fire(MAP_EVENT.MAP_CENTER_CHANGE, lngLatToPixel(coords[0], coords[1]));
      adapter.event.fire(MAP_EVENT.MAP_MOVE_END, undefined);
    },
    [adapter, view, initialZoom]
  );

  const handlePress = useCallback(
    (feature: GeoJSON.Feature) => {
      const geom = feature.geometry;
      if (geom.type !== 'Point') return;
      const coords = geom.coordinates;
      adapter.event.fire(MAP_EVENT.MAP_CLICK, {
        coordinate: [coords[0], coords[1]] as [number, number],
        pixel: [0, 0],
      });
    },
    [adapter]
  );

  const handleMapLoaded = useCallback(() => {
    if (mapReady.current) return;
    mapReady.current = true;
    cameraRef.current?.setCamera({
      centerCoordinate: initialCenter,
      zoomLevel: initialZoom,
      animationDuration: 0,
    });
    cameraPositionRef.current = { center: initialCenter, zoom: initialZoom };
  }, [initialCenter, initialZoom]);

  return (
    <MapView
      style={{ flex: 1 }}
      mapStyle={mapStyle}
      logoEnabled={false}
      attributionEnabled={false}
      compassEnabled={false}
      onRegionDidChange={handleRegionDidChange}
      onPress={handlePress}
      onDidFinishLoadingMap={handleMapLoaded}
    >
      <Camera
        ref={cameraRef}
        minZoomLevel={zoomConfig.min}
        maxZoomLevel={zoomConfig.max}
      />
      <AreaNameLayer />
      <EntityMarkerLayer
        onEntityPress={onEntityPress}
        mapCameraRef={cameraRef}
        cameraPositionRef={cameraPositionRef}
      />
    </MapView>
  );
}

export const GameMapView = observer(function GameMapView({ onEntityPress }: GameMapViewProps) {
  const adapter = useAdapter();
  const currentMapId = adapter.mapController.dataManager.currentMapId;

  return (
    <GameMapViewInner
      adapter={adapter}
      currentMapId={currentMapId}
      onEntityPress={onEntityPress}
    />
  );
});
