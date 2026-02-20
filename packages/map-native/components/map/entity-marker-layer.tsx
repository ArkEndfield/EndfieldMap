import { pixelToLngLat } from '@endfieldmap/map-adapter-maplibre';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';

import { useAdapter } from '@/context/adapter';

interface EntityMarkerLayerProps {
  onEntityPress?: (instance: EntityDataInstance) => void;
}

interface EntityGeoFeature {
  type: 'Feature';
  id: number;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    entityId: number;
    icon: string;
    marked: boolean;
    entityDataIdKey: string;
    mapId: string;
  };
}

/**
 * 将当前可见实体转为 GeoJSON FeatureCollection
 */
function buildEntityGeoJSON(
  instances: EntityDataInstance[],
  entityImageBase: string
): GeoJSON.FeatureCollection {
  const features: EntityGeoFeature[] = [];

  for (const instance of instances) {
    const lngLat = pixelToLngLat(instance.coordinates);
    features.push({
      type: 'Feature',
      id: instance.id,
      geometry: {
        type: 'Point',
        coordinates: lngLat,
      },
      properties: {
        entityId: instance.id,
        icon: `${entityImageBase}/${instance.iconName}.png`,
        marked: instance.marked,
        entityDataIdKey: instance.entityDataIdKey,
        mapId: instance.mapId,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

export const EntityMarkerLayer = observer(function EntityMarkerLayer({
  onEntityPress,
}: EntityMarkerLayerProps) {
  const adapter = useAdapter();
  const entityController = adapter.entityController;
  const entityImageBase = adapter.asset.entityImage;

  const visibleInstances = entityController.currentVisibleInstances;

  const geoJSON = useMemo(
    () => buildEntityGeoJSON(visibleInstances, entityImageBase),
    [visibleInstances, entityImageBase]
  );

  const handlePress = (event: GeoJSON.Feature) => {
    if (!onEntityPress) return;
    const entityId = event.properties?.entityId;
    if (typeof entityId !== 'number') return;

    const mapId = adapter.mapController.dataManager.currentMapId;
    const instance = entityController.getInstanceById(mapId, entityId);
    if (instance) {
      onEntityPress(instance);
    }
  };

  if (visibleInstances.length === 0) return null;

  return (
    <MapLibreGL.ShapeSource
      id="entitySource"
      shape={geoJSON}
      cluster
      clusterRadius={30}
      clusterMaxZoomLevel={4}
      onPress={(e) => {
        if (e.features?.[0]) handlePress(e.features[0]);
      }}
    >
      <MapLibreGL.SymbolLayer
        id="entityCluster"
        filter={['has', 'point_count']}
        style={{
          textField: ['get', 'point_count_abbreviated'],
          textSize: 14,
          textColor: '#ffffff',
          textHaloColor: '#333333',
          textHaloWidth: 1.5,
          iconImage: 'defaultMarker',
          iconSize: 0.6,
          iconAllowOverlap: true,
          textAllowOverlap: true,
        }}
      />
      <MapLibreGL.SymbolLayer
        id="entityPoints"
        filter={['!', ['has', 'point_count']]}
        style={{
          iconImage: ['get', 'icon'],
          iconSize: 0.5,
          iconAllowOverlap: true,
          iconAnchor: 'center',
          iconOpacity: [
            'case',
            ['get', 'marked'],
            0.5,
            1,
          ],
        }}
      />
    </MapLibreGL.ShapeSource>
  );
});
