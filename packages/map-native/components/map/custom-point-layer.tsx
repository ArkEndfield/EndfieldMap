import { pixelToLngLat } from '@endfieldmap/map-adapter-maplibre';
import { MAP_EVENT } from '@endfieldmap/map-core';
import type { CustomPointDataInstance } from '@endfieldmap/map-core';
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
import type { CameraPositionRef } from './entity-marker-layer';

const ICON_TARGET_PX = 20;
const BG_RADIUS = ICON_TARGET_PX / 2 + 3;
const DEFAULT_ICON_SIZE = 44;
const FALLBACK_SCALE = ICON_TARGET_PX / DEFAULT_ICON_SIZE;

const POINTER_HEIGHT = 6;
const LIFT = BG_RADIUS + POINTER_HEIGHT;

const STROKE_COLOR = '#3A3A3A';

interface CustomPointMarkerLayerProps {
  onCustomPointPress?: (instance: CustomPointDataInstance) => void;
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

/**
 * Get visible instances respecting per-type visibility from the filter panel.
 */
function getVisibleInstances(
  instances: CustomPointDataInstance[],
  globalVisible: boolean
): CustomPointDataInstance[] {
  if (!globalVisible) return [];
  return instances.filter((inst) => inst.visible);
}

function buildPointGeoJSON(
  instances: CustomPointDataInstance[],
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
        pointId: instance.id,
        typeId: instance.typeId,
        iconKey: instance.iconName,
        iconScale: iconScales[instance.iconName] ?? FALLBACK_SCALE,
        active: instance.id === activeId,
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

export const CustomPointMarkerLayer = observer(function CustomPointMarkerLayer({
  onCustomPointPress,
  mapCameraRef,
  cameraPositionRef,
}: CustomPointMarkerLayerProps) {
  const adapter = useAdapter();
  const customPointController = adapter.customPointController;
  const dataManager = customPointController.dataManager;
  const entityImageBase = adapter.asset.entityImage;
  const activeFeature = adapter.activeFeatureController.activeFeature;

  // Track dataVersion to trigger re-renders
  const _version = customPointController.dataVersion;
  void _version;

  const globalVisible = dataManager.visible;
  const currentManager = dataManager.currentManager;
  const allInstances = currentManager?.instances ?? [];

  const visibleInstances = getVisibleInstances(allInstances, globalVisible);

  // Collect unique icon keys
  const iconKeySet = new Set<string>();
  for (const inst of visibleInstances) iconKeySet.add(inst.iconName);
  const iconKeys = Array.from(iconKeySet).sort();

  const iconScales = useIconScales(iconKeys, entityImageBase);

  // Build icon image map
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

  const activeId = activeFeature?.id;

  const pointGeoJSON = visibleInstances.length > 0
    ? buildPointGeoJSON(visibleInstances, iconScales, activeId)
    : EMPTY_FC;

  // Stabilize camera on data change
  const prevGeoRef = useRef(pointGeoJSON);
  const mountedRef = useRef(false);
  if (!mountedRef.current) {
    mountedRef.current = true;
  } else if (prevGeoRef.current !== pointGeoJSON) {
    prevGeoRef.current = pointGeoJSON;
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
      const pointId = feature.properties?.pointId;
      if (typeof pointId !== 'number') return;

      const mapId = adapter.mapController.dataManager.currentMapId;
      const manager = dataManager.getMapManager(mapId);
      const instance = manager.getById(pointId);
      if (!instance) return;

      adapter.event.fire(MAP_EVENT.ENTITY_CLICK, {
        instance,
        coordinate: instance.coordinates,
      });

      adapter.activeFeatureController.setActiveFeature(instance);
      onCustomPointPress?.(instance);
    },
    [adapter, dataManager, onCustomPointPress]
  );

  return (
    <>
      <Images images={iconImages} />

      <ShapeSource
        id="customPointSource"
        shape={pointGeoJSON}
        onPress={handlePress}
      >
        {/* Pointer triangle */}
        <SymbolLayer
          id="customPointPointer"
          style={{
            textField: '\u25BC',
            textFont: ['literal', [...MAP_SYMBOL_FONT_STACK]],
            textSize: 12,
            textColor: ['case', ['get', 'active'], '#FFD700', STROKE_COLOR],
            textAllowOverlap: true,
            textIgnorePlacement: true,
            textOffset: [0, -0.2],
          }}
        />
        {/* Background circle (lifted) */}
        <CircleLayer
          id="customPointBg"
          style={{
            circleRadius: BG_RADIUS,
            circleColor: '#525152',
            circleTranslate: [0, -LIFT],
            circleStrokeWidth: ['case', ['get', 'active'], 2.5, 2],
            circleStrokeColor: ['case', ['get', 'active'], '#FFD700', STROKE_COLOR],
          }}
        />
        {/* Icon (lifted) */}
        <SymbolLayer
          id="customPointIcon"
          style={{
            iconImage: ['get', 'iconKey'],
            iconSize: ['get', 'iconScale'],
            iconAllowOverlap: true,
            iconAnchor: 'center',
            iconTranslate: [0, -LIFT],
          }}
        />
      </ShapeSource>
    </>
  );
});
