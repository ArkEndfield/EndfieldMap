import { pixelToLngLat } from '@endfieldmap/map-adapter-maplibre';
import {
  ELECTRIC_POLE_DEVICE_CONFIGS,
  MAP_EVENT,
} from '@endfieldmap/map-core';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core';
import {
  CircleLayer,
  Images,
  LineLayer,
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

const CONNECTION_COLOR = '#FFD700';
const CONNECTION_WIDTH = 2;

/**
 * Build interpolation stops for circleRadius = zoneRadius * 2^(zoom+1).
 *
 * OL uses a SIMPLE projection (units = "pixels", extent [0,0,256,256]) and
 * passes the radius in CRD pixel units directly to CircleGeom.
 *
 * MapLibre Native uses Web Mercator with an internal world size of 512 px at
 * zoom 0, while the CRD tile extent is 256 px. So the conversion factor is:
 *   1 CRD pixel = (512 / 256) * 2^zoom = 2^(zoom+1) screen pixels
 *
 * MapLibre Native restricts ['zoom'] to top-level interpolate/step inputs,
 * so we pre-compute stops at every integer zoom level. With base-2 exponential
 * interpolation between adjacent stops that each double, intermediate values
 * are exact: v0 + (2^t - 1) * (2*v0 - v0) = v0 * 2^t. TODO: 去 any
 */
const ZONE_RADIUS_EXPR = ['interpolate', ['exponential', 2], ['zoom']] as any;
for (let z = 0; z <= 20; z++) {
  ZONE_RADIUS_EXPR.push(z);
  ZONE_RADIUS_EXPR.push(['*', 2 ** (z + 1), ['get', 'zoneRadius']]);
}

/** Convert ELECTRIC_POLE_DEVICE_CONFIGS rgba fillColor to hex + opacity */
const DEVICE_ZONE_STYLES: Record<string, { fillHex: string; fillOpacity: number; strokeHex: string }> = {};
for (const [key, cfg] of Object.entries(ELECTRIC_POLE_DEVICE_CONFIGS)) {
  const rgba = cfg.fillColor ?? 'rgba(228, 169, 21, 0.15)';
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/.exec(rgba);
  const r = m ? Number(m[1]) : 228;
  const g = m ? Number(m[2]) : 169;
  const b = m ? Number(m[3]) : 21;
  const a = m && m[4] !== undefined ? Number(m[4]) : 0.15;
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  DEVICE_ZONE_STYLES[key] = {
    fillHex: hex,
    fillOpacity: a,
    strokeHex: cfg.strokeColor ?? '#E4A915',
  };
}

interface ElectricPoleMarkerLayerProps {
  onElectricPolePress?: (instance: ElectricPoleDataInstance) => void;
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
 * Get visible instances respecting per-device visibility from the filter panel.
 */
function getVisibleInstances(
  instances: ElectricPoleDataInstance[],
  globalVisible: boolean
): ElectricPoleDataInstance[] {
  if (!globalVisible) return [];
  return instances.filter((inst) => inst.visible);
}

function buildPoleGeoJSON(
  instances: ElectricPoleDataInstance[],
  iconScales: Record<string, number>,
  activeId: number | undefined
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const instance of instances) {
    const lngLat = pixelToLngLat(instance.coordinates);
    const config = ELECTRIC_POLE_DEVICE_CONFIGS[instance.deviceKey];
    features.push({
      type: 'Feature',
      id: instance.id,
      geometry: { type: 'Point', coordinates: lngLat },
      properties: {
        poleId: instance.id,
        deviceKey: instance.deviceKey,
        iconKey: config.iconPic,
        iconScale: iconScales[config.iconPic] ?? FALLBACK_SCALE,
        strokeColor: config.strokeColor ?? '#E4A915',
        active: instance.id === activeId,
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

function buildConnectionGeoJSON(
  instances: ElectricPoleDataInstance[]
): GeoJSON.FeatureCollection {
  const visibleIds = new Set(instances.map((i) => i.id));
  const features: GeoJSON.Feature[] = [];
  let featureId = 1;

  for (const instance of instances) {
    const fromLngLat = pixelToLngLat(instance.coordinates);
    for (const target of instance.outgoingConnections) {
      if (!visibleIds.has(target.id)) continue;
      const toLngLat = pixelToLngLat(target.coordinates);
      features.push({
        type: 'Feature',
        id: featureId++,
        geometry: {
          type: 'LineString',
          coordinates: [fromLngLat, toLngLat],
        },
        properties: {
          fromId: instance.id,
          toId: target.id,
        },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

/**
 * Build Point features for zone circles.
 * Uses CircleLayer instead of FillLayer polygons,
 * because FillLayer does not render on maplibre-react-native v10 + New Architecture.
 *
 * CircleLayer radius is in screen pixels. In the CRD→Mercator mapping the full
 * 256-pixel CRD extent maps to one zoom-0 tile (256 screen px), so 1 CRD unit
 * = 2^zoom screen pixels. The layer style uses: circleRadius = zoneRadius * 2^zoom.
 */
function buildZonePointGeoJSON(
  instances: ElectricPoleDataInstance[]
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  let featureId = 1;
  for (const instance of instances) {
    const radius = instance.zoneRadius;
    if (!Number.isFinite(radius) || radius <= 0) continue;
    const lngLat = pixelToLngLat(instance.coordinates);
    const zoneStyle = DEVICE_ZONE_STYLES[instance.deviceKey];
    features.push({
      type: 'Feature',
      id: featureId++,
      geometry: { type: 'Point', coordinates: lngLat },
      properties: {
        poleId: instance.id,
        zoneRadius: radius,
        fillColor: zoneStyle?.fillHex ?? '#E4A915',
        fillOpacity: zoneStyle?.fillOpacity ?? 0.15,
        strokeColor: zoneStyle?.strokeHex ?? '#E4A915',
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

export const ElectricPoleMarkerLayer = observer(function ElectricPoleMarkerLayer({
  onElectricPolePress,
  mapCameraRef,
  cameraPositionRef,
}: ElectricPoleMarkerLayerProps) {
  const adapter = useAdapter();
  const electricPoleController = adapter.electricPoleController;
  const dataManager = electricPoleController.dataManager;
  const entityImageBase = adapter.asset.entityImage;
  const activeFeature = adapter.activeFeatureController.activeFeature;

  // Track dataVersion to trigger re-renders
  const _version = electricPoleController.dataVersion;
  void _version;

  const globalVisible = dataManager.visible;
  const zoneVisible = dataManager.zoneVisible;
  const allInstances = dataManager.currentInstances;

  const visibleInstances = getVisibleInstances(allInstances, globalVisible);

  // Collect unique icon keys from device configs
  const iconKeySet = new Set<string>();
  for (const inst of visibleInstances) {
    const config = ELECTRIC_POLE_DEVICE_CONFIGS[inst.deviceKey];
    iconKeySet.add(config.iconPic);
  }
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

  const poleGeoJSON = visibleInstances.length > 0
    ? buildPoleGeoJSON(visibleInstances, iconScales, activeId)
    : EMPTY_FC;

  const connectionGeoJSON = visibleInstances.length > 0
    ? buildConnectionGeoJSON(visibleInstances)
    : EMPTY_FC;

  const zoneGeoJSON = visibleInstances.length > 0 && zoneVisible
    ? buildZonePointGeoJSON(visibleInstances)
    : EMPTY_FC;

  // Stabilize camera on data change
  const prevGeoRef = useRef(poleGeoJSON);
  const mountedRef = useRef(false);
  if (!mountedRef.current) {
    mountedRef.current = true;
  } else if (prevGeoRef.current !== poleGeoJSON) {
    prevGeoRef.current = poleGeoJSON;
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
      const poleId = feature.properties?.poleId;
      if (typeof poleId !== 'number') return;

      const mapId = adapter.mapController.dataManager.currentMapId;
      const manager = dataManager.getMapManager(mapId);
      const instance = manager.getById(poleId);
      if (!instance) return;

      adapter.event.fire(MAP_EVENT.ENTITY_CLICK, {
        instance,
        coordinate: instance.coordinates,
      });

      adapter.activeFeatureController.setActiveFeature(instance);
      onElectricPolePress?.(instance);
    },
    [adapter, dataManager, onElectricPolePress]
  );

  return (
    <>
      <Images images={iconImages} />

      {/* Zone circles using CircleLayer (FillLayer broken on RN v10 + New Arch) */}
      <ShapeSource id="electricPoleZoneSource" shape={zoneGeoJSON}>
        <CircleLayer
          id="electricPoleZoneFill"
          style={{
            circleRadius: ZONE_RADIUS_EXPR,
            circleColor: ['get', 'fillColor'],
            circleOpacity: ['to-number', ['get', 'fillOpacity']],
            circleStrokeColor: ['get', 'strokeColor'],
            circleStrokeWidth: 1,
            circleStrokeOpacity: 0.5,
            circlePitchAlignment: 'map',
          }}
        />
      </ShapeSource>

      {/* Connection lines */}
      <ShapeSource id="electricPoleConnectionSource" shape={connectionGeoJSON}>
        <LineLayer
          id="electricPoleConnectionLine"
          style={{
            lineColor: CONNECTION_COLOR,
            lineWidth: CONNECTION_WIDTH,
            lineOpacity: 0.8,
          }}
        />
      </ShapeSource>

      {/* Pole markers */}
      <ShapeSource
        id="electricPoleMarkerSource"
        shape={poleGeoJSON}
        onPress={handlePress}
      >
        {/* Pointer triangle */}
        <SymbolLayer
          id="electricPolePointer"
          style={{
            textField: '\u25BC',
            textFont: ['literal', [...MAP_SYMBOL_FONT_STACK]],
            textSize: 12,
            textColor: ['case', ['get', 'active'], '#FFD700', ['get', 'strokeColor']],
            textAllowOverlap: true,
            textIgnorePlacement: true,
            textOffset: [0, -0.2],
          }}
        />
        {/* Background circle (lifted) */}
        <CircleLayer
          id="electricPoleBg"
          style={{
            circleRadius: BG_RADIUS,
            circleColor: '#525152',
            circleTranslate: [0, -LIFT],
            circleStrokeWidth: ['case', ['get', 'active'], 2.5, 2],
            circleStrokeColor: ['case', ['get', 'active'], '#FFD700', ['get', 'strokeColor']],
          }}
        />
        {/* Icon (lifted) */}
        <SymbolLayer
          id="electricPoleIcon"
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
