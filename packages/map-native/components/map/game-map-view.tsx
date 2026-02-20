import { pixelToLngLat } from '@endfieldmap/map-adapter-maplibre';
import type { MapLibreAdapter } from '@endfieldmap/map-adapter-maplibre';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import MapLibreGL, { Camera, MapView } from '@maplibre/maplibre-react-native';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { useAdapter } from '@/context/adapter';

import { AreaNameLayer } from './area-name-layer';
import { EntityMarkerLayer } from './entity-marker-layer';

MapLibreGL.setAccessToken(null);

/**
 * 生成一个空白瓦片样式（无基础地图），
 * 用于加载自定义游戏地图瓦片
 */
function buildMapStyle(
  tileUrl: string,
  minZoom: number,
  maxZoom: number
) {
  return {
    version: 8,
    name: 'GameMap',
    // 提供 glyphs 才能渲染文本（区域名称等）
    // 使用 MapLibre 默认字体服务
    sources: {
      gameMapTiles: {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        minzoom: minZoom,
        maxzoom: maxZoom,
      },
    },
    layers: [
      {
        id: 'gameMapLayer',
        type: 'raster',
        source: 'gameMapTiles',
        paint: {
          'raster-opacity': 1,
        },
      },
    ],
  };
}

interface GameMapViewProps {
  onEntityPress?: (instance: EntityDataInstance) => void;
}

export const GameMapView = observer(function GameMapView({ onEntityPress }: GameMapViewProps) {
  const adapter = useAdapter();
  const cameraRef = useRef<MapLibreGL.CameraRef>(null);
  const mapViewRef = useRef<MapLibreGL.MapViewRef>(null);

  const mapController = adapter.mapController;
  const view = mapController.view;
  const currentMapId = mapController.dataManager.currentMapId;
  const zoomConfig = mapController.zoomConfig;

  const mapStyle = useMemo(() => {
    const tileUrl = mapController.tileUrlTemplate;
    if (!tileUrl) {
      // 如果 tileUrl 为空，返回一个空样式避免错误
      return {
        version: 8,
        name: 'EmptyMap',
        sources: {},
        layers: [],
      };
    }
    return buildMapStyle(tileUrl, zoomConfig.min, zoomConfig.max);
  }, [mapController.tileUrlTemplate, zoomConfig.min, zoomConfig.max]);

  const initialCenter = useMemo(() => {
    const center = view.currentCenterLngLat;
    if (center) return center;
    const mapData = mapController.dataManager.currentMap;
    if (!mapData) return [0, 0] as [number, number];
    return pixelToLngLat(mapController.dataManager.getMapCenter(mapData.id));
  }, [view, mapController.dataManager]);

  const initialZoom = zoomConfig.default;

  useEffect(() => {
    return handlePendingAnimations(adapter, cameraRef);
  }, [adapter]);

  const handleRegionDidChange = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point>) => {
      const coords = feature.geometry.coordinates;
      const zoom = feature.properties?.zoomLevel ?? view.getZoom() ?? initialZoom;
      view.syncFromMap([coords[0], coords[1]], zoom);
      adapter.event.fire(MAP_EVENT.MAP_MOVE_END, undefined);
    },
    [adapter, view, initialZoom]
  );

  const handlePress = useCallback(
    (feature: GeoJSON.Feature) => {
      const geom = feature.geometry;
      if (geom.type !== 'Point') return;
      const coords = geom.coordinates;
      const pixel: [number, number] = [coords[0], coords[1]];
      adapter.event.fire(MAP_EVENT.MAP_CLICK, {
        coordinate: pixel,
        pixel: [0, 0],
      });
    },
    [adapter]
  );

  return (
    <MapView
      key={mapController.tileUrlTemplate}
      ref={mapViewRef}
      style={styles.map}
      mapStyle={mapStyle}
      logoEnabled={false}
      attributionEnabled={false}
      compassEnabled={false}
      onRegionDidChange={handleRegionDidChange}
      onPress={handlePress}
    >
      <Camera
        ref={cameraRef}
        key={`${currentMapId}-${initialZoom}`}
        defaultSettings={{
          centerCoordinate: initialCenter,
          zoomLevel: initialZoom,
        }}
        minZoomLevel={zoomConfig.min}
        maxZoomLevel={zoomConfig.max}
      />
      <EntityMarkerLayer onEntityPress={onEntityPress} />
      <AreaNameLayer />
    </MapView>
  );
});

function handlePendingAnimations(
  adapter: MapLibreAdapter,
  cameraRef: React.RefObject<MapLibreGL.CameraRef | null>
) {
  let animationTimer: ReturnType<typeof setInterval> | null = null;

  const check = () => {
    const animation = adapter.mapController.view.consumeAnimation();
    if (!animation || !cameraRef.current) return;

    const config: { centerCoordinate?: [number, number]; zoomLevel?: number; animationDuration?: number } = {};
    if (animation.center) config.centerCoordinate = animation.center;
    if (animation.zoom !== undefined) config.zoomLevel = animation.zoom;
    config.animationDuration = animation.duration ?? 500;

    if (config.animationDuration > 0) {
      cameraRef.current.setCamera({
        ...config,
        animationMode: 'flyTo',
      });
    } else {
      cameraRef.current.setCamera(config);
    }
  };

  animationTimer = setInterval(check, 100);
  return () => {
    if (animationTimer) clearInterval(animationTimer);
  };
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
