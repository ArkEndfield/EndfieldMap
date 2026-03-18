import { describe, expect, it } from 'vitest';

import { MapDataManager } from './map';

function createMapData() {
  return {
    version: '1.0.0',
    data: [
      {
        id: 'map_1',
        name: 'Map One',
        center: { x: 100, y: 0, z: 200 },
        scale: 10,
        offset: { x: 5, y: 0, z: 7 },
        electricZoneBaseSize: 80,
        regions: [],
      },
      {
        id: 'map_2',
        name: 'Map Two',
        center: { x: 50, y: 0, z: 60 },
        scale: 5,
        offset: { x: 1, y: 0, z: 2 },
        electricZoneBaseSize: 160,
        regions: [],
      },
    ],
  };
}

describe('MapDataManager', () => {
  it('initializes current map state and exposes lookups', () => {
    const manager = new MapDataManager(createMapData());

    expect(manager.version).toBe('1.0.0');
    expect(manager.currentMapId).toBe('map_1');
    expect(manager.currentMap?.name).toBe('Map One');
    expect(manager.mapIds).toEqual(['map_1', 'map_2']);
    expect(manager.getMapData('map_2')?.name).toBe('Map Two');
  });

  it('converts between xyz and crd coordinates and computes map center', () => {
    const manager = new MapDataManager(createMapData());

    expect(manager.xyz2crd({ x: 100, y: 0, z: 200 }, 'map_1')).toEqual([15, 27]);
    expect(manager.crd2xyz([15, 27], 'map_1')).toEqual({ x: 100, y: 0, z: 200 });
    expect(manager.getMapCenter('map_1')).toEqual([15, 27]);
  });

  it('computes electric pole range radius and supports map switching', () => {
    const manager = new MapDataManager(createMapData());

    expect(manager.getElectricPoleRangeRadius('map_1', 'pole')).toBe(30);
    expect(manager.getElectricPoleRangeRadius('map_2', 'zipline_80')).toBe(160);

    manager.setCurrentMap('map_2');
    expect(manager.currentMapId).toBe('map_2');
  });

  it('throws for invalid map data or unknown map ids', () => {
    expect(() => new MapDataManager({ version: '1.0.0', data: [] })).toThrow('Invalid map data');

    const manager = new MapDataManager(createMapData());
    expect(() => manager.getMapCenter('missing')).toThrow('Invalid map id');
    expect(() => manager.xyz2crd({ x: 0, y: 0, z: 0 }, 'missing')).toThrow('Invalid map id');
    expect(() => manager.crd2xyz([0, 0], 'missing')).toThrow('Invalid map id');
    expect(() => manager.setCurrentMap('missing')).toThrow('Invalid map id');
  });
});
