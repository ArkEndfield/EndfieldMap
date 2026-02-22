import { pixelToLngLat } from '@endfieldmap/map-adapter-maplibre';
import type { EntityDataInstance } from '@endfieldmap/map-core';
import {
  CircleLayer,
  Images,
  ShapeSource,
  SymbolLayer,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';

import { useAdapter } from '@/context/adapter';
import { MAP_SYMBOL_FONT_STACK } from './area-name-layer';

const ICON_TARGET_PX = 20;
const BG_RADIUS = ICON_TARGET_PX / 2 + 3;
const DEFAULT_ICON_SIZE = 44;
const FALLBACK_SCALE = ICON_TARGET_PX / DEFAULT_ICON_SIZE;

const POINTER_HEIGHT = 6;
const LIFT = BG_RADIUS + POINTER_HEIGHT;

export interface CameraPositionRef {
  center: [number, number] | undefined;
  zoom: number | undefined;
}

interface EntityMarkerLayerProps {
  onEntityPress?: (instance: EntityDataInstance) => void;
  mapCameraRef?: React.RefObject<CameraRef | null>;
  cameraPositionRef?: React.RefObject<CameraPositionRef>;
}

function useIconScales(
  iconKeys: string[],
  entityImageBase: string
): Record<string, number> {
  const [scales, setScales] = useState<Record<string, number>>({});
  const pendingRef = useRef(new Set<string>());
  const keySig = iconKeys.join(',');

  useEffect(() => {
    for (const key of iconKeys) {
      if (scales[key] !== undefined || pendingRef.current.has(key)) continue;
      pendingRef.current.add(key);
      const uri = `${entityImageBase}/${key}.png`;
      Image.getSize(
        uri,
        (w) => {
          pendingRef.current.delete(key);
          const s = w > 0 ? ICON_TARGET_PX / w : FALLBACK_SCALE;
          setScales((prev) => (prev[key] === s ? prev : { ...prev, [key]: s }));
        },
        () => {
          pendingRef.current.delete(key);
          setScales((prev) =>
            prev[key] === FALLBACK_SCALE ? prev : { ...prev, [key]: FALLBACK_SCALE }
          );
        }
      );
    }
  }, [keySig, entityImageBase, scales, iconKeys]);

  return scales;
}


function buildGeoJSON(
  instances: EntityDataInstance[],
  iconScales: Record<string, number>,
  activeId: number | undefined
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const instance of instances) {
    const lngLat = pixelToLngLat(instance.coordinates);
    features.push({
      type: 'Feature',
      id: instance.id,
      geometry: { type: 'Point', coordinates: lngLat },
      properties: {
        entityId: instance.id,
        iconKey: instance.iconName,
        iconScale: iconScales[instance.iconName] ?? FALLBACK_SCALE,
        marked: instance.marked,
        markedNum: instance.marked ? 1 : 0,
        active: instance.id === activeId,
        total: 1,
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

export const EntityMarkerLayer = observer(function EntityMarkerLayer({
  onEntityPress,
  mapCameraRef,
  cameraPositionRef,
}: EntityMarkerLayerProps) {
  const adapter = useAdapter();
  const entityController = adapter.entityController;
  const entityImageBase = adapter.asset.entityImage;
  const activeFeature = adapter.activeFeatureController.activeFeature;

  const visibleInstances = entityController.currentVisibleInstances;

  const iconKeySet = new Set<string>();
  for (const inst of visibleInstances) iconKeySet.add(inst.iconName);
  const iconKeys = Array.from(iconKeySet).sort();

  const iconScales = useIconScales(iconKeys, entityImageBase);

  const prevSigRef = useRef('');
  const prevImagesRef = useRef<Record<string, { uri: string }>>({});
  const sig = iconKeys.join(',');
  let iconImages = prevImagesRef.current;
  if (sig !== prevSigRef.current) {
    const map: Record<string, { uri: string }> = {};
    for (const key of iconKeys) map[key] = { uri: `${entityImageBase}/${key}.png` };
    prevSigRef.current = sig;
    prevImagesRef.current = map;
    iconImages = map;
  }

  const geoJSON =
    visibleInstances.length > 0
      ? buildGeoJSON(visibleInstances, iconScales, activeFeature?.id)
      : EMPTY_FC;

  const prevGeoRef = useRef(geoJSON);
  const mountedRef = useRef(false);
  if (!mountedRef.current) {
    mountedRef.current = true;
  } else if (prevGeoRef.current !== geoJSON) {
    prevGeoRef.current = geoJSON;
    const pos = cameraPositionRef?.current;
    if (pos?.center && pos.zoom !== undefined && mapCameraRef?.current) {
      mapCameraRef.current.setCamera({
        centerCoordinate: pos.center,
        zoomLevel: pos.zoom,
        animationDuration: 0,
      });
    }
  }

  const handlePress = useCallback(
    (event: { features?: GeoJSON.Feature[] }) => {
      if (!event.features?.length) return;
      const feature = event.features[0];

      if (feature.properties?.point_count) {
        const currentZoom = adapter.mapController.view.getZoom() ?? 3;
        const geom = feature.geometry;
        const clusterCenter =
          geom.type === 'Point' ? (geom.coordinates as [number, number]) : undefined;
        const cam = mapCameraRef?.current;
        if (cam) {
          cam.setCamera({
            ...(clusterCenter ? { centerCoordinate: clusterCenter } : {}),
            zoomLevel: Math.min(currentZoom + 2, adapter.mapController.zoomConfig.max),
            animationDuration: 500,
            animationMode: 'flyTo',
          });
        }
        return;
      }

      if (!onEntityPress) return;
      const entityId = feature.properties?.entityId;
      if (typeof entityId !== 'number') return;
      const mapId = adapter.mapController.dataManager.currentMapId;
      const instance = entityController.getInstanceById(mapId, entityId);
      if (instance) {
        adapter.activeFeatureController.setActiveFeature(instance);
        onEntityPress(instance);
      }
    },
    [adapter, entityController, onEntityPress, mapCameraRef]
  );

  return (
    <>
      <Images images={iconImages} />
      <ShapeSource
        id="entitySource"
        shape={geoJSON}
        cluster
        clusterRadius={30}
        clusterMaxZoomLevel={6}
        clusterProperties={{
          firstIcon: [
            ['coalesce', ['accumulated'], ['get', 'firstIcon']],
            ['get', 'iconKey'],
          ],
          firstScale: [
            ['coalesce', ['accumulated'], ['get', 'firstScale']],
            ['get', 'iconScale'],
          ],
          clusterMarkedNum: [['+', ['accumulated'], ['get', 'clusterMarkedNum']], ['get', 'markedNum']],
          clusterTotal: [['+', ['accumulated'], ['get', 'clusterTotal']], ['get', 'total']],
        }}
        onPress={handlePress}
      >
        {/* ── Cluster ── */}
        <CircleLayer
          id="clusterBg"
          filter={['has', 'point_count']}
          style={{
            circleRadius: ['step', ['get', 'point_count'], 14, 10, 16, 50, 20],
            circleColor: '#525152',
            circleOpacity: [
              'case',
              ['==', ['get', 'clusterMarkedNum'], ['get', 'clusterTotal']],
              0.4,
              ['>', ['get', 'clusterMarkedNum'], 0],
              0.6,
              0.92,
            ],
            circleStrokeWidth: 2,
            circleStrokeColor: '#2E2F2E',
          }}
        />
        <SymbolLayer
          id="clusterIcon"
          filter={['has', 'point_count']}
          style={{
            iconImage: ['get', 'firstIcon'],
            iconSize: ['coalesce', ['get', 'firstScale'], FALLBACK_SCALE],
            iconAllowOverlap: true,
            iconAnchor: 'center',
            iconOffset: [0, -8],
            iconOpacity: [
              'case',
              ['==', ['get', 'clusterMarkedNum'], ['get', 'clusterTotal']],
              0.4,
              ['>', ['get', 'clusterMarkedNum'], 0],
              0.6,
              1,
            ],
          }}
        />
        <SymbolLayer
          id="clusterCount"
          filter={['has', 'point_count']}
          style={{
            textField: ['get', 'point_count_abbreviated'],
            textFont: ['literal', [...MAP_SYMBOL_FONT_STACK]],
            textSize: 10,
            textColor: '#ffffff',
            textAllowOverlap: true,
            textAnchor: 'top',
            textOffset: [0, 0.3],
          }}
        />

        {/* ── Individual entity: pointer triangle ── */}
        <SymbolLayer
          id="entityPointer"
          filter={['!', ['has', 'point_count']]}
          style={{
            textField: '▼',
            textFont: ['literal', [...MAP_SYMBOL_FONT_STACK]],
            textSize: 12,
            textColor: ['case', ['get', 'active'], '#FFD700', '#2E2F2E'],
            textAllowOverlap: true,
            textIgnorePlacement: true,
            textOffset: [0, -0.2],
            textOpacity: ['case', ['get', 'marked'], 0.4, 1],
          }}
        />
        {/* ── Individual entity: background circle (lifted) ── */}
        <CircleLayer
          id="entityBg"
          filter={['!', ['has', 'point_count']]}
          style={{
            circleRadius: BG_RADIUS,
            circleColor: '#525152',
            circleTranslate: [0, -LIFT],
            circleStrokeWidth: ['case', ['get', 'active'], 2.5, 2],
            circleStrokeColor: ['case', ['get', 'active'], '#FFD700', '#2E2F2E'],
            circleOpacity: ['case', ['get', 'marked'], 0.4, 1],
            circleStrokeOpacity: ['case', ['get', 'marked'], 0.4, 1],
          }}
        />
        {/* ── Individual entity: icon (lifted) ── */}
        <SymbolLayer
          id="entityIcon"
          filter={['!', ['has', 'point_count']]}
          style={{
            iconImage: ['get', 'iconKey'],
            iconSize: ['get', 'iconScale'],
            iconAllowOverlap: true,
            iconAnchor: 'center',
            iconTranslate: [0, -LIFT],
            iconOpacity: ['case', ['get', 'marked'], 0.4, 1],
          }}
        />
      </ShapeSource>
    </>
  );
});
