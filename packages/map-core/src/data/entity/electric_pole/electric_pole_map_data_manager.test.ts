import { ElectricPoleIdKey } from '@endfieldmap/map-core/const/map';
import type { ElectricPoleData } from '@endfieldmap/map-core/types/entity';
import { describe, expect, it } from 'vitest';

import { ElectricPoleMapDataManager } from './electric_pole_map_data_manager';

function createMapDataManager() {
  return {
    currentMapId: 'map_1',
    mapIds: ['map_1', 'map_2'],
    xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
    getElectricPoleRangeRadius: () => 100,
  } as never;
}

function createPole(
  id: number,
  deviceKey: 'pole' | 'zipline_80' = 'pole',
  connections?: number[]
): ElectricPoleData {
  return {
    levelLogicId: id,
    entityDataIdKey: ElectricPoleIdKey,
    templateId: ElectricPoleIdKey,
    entityType: '#ElectricPole',
    position: { x: id * 10, y: 0, z: id * 10 },
    properties: {
      deviceKey,
      connections,
    },
  };
}

describe('ElectricPoleMapDataManager', () => {
  it('initializes managers for known maps and exposes current instances', () => {
    const manager = new ElectricPoleMapDataManager(createMapDataManager());

    expect(manager.mapManagers.has('map_1')).toBe(true);
    expect(manager.mapManagers.has('map_2')).toBe(true);
    expect(manager.currentInstances).toEqual([]);
  });

  it('loads map data and switches managers', () => {
    const manager = new ElectricPoleMapDataManager(createMapDataManager());

    manager.loadData({
      map_1: [createPole(1)],
      map_2: [createPole(2, 'zipline_80')],
    });

    expect(manager.getMapManager('map_1').count).toBe(1);
    expect(manager.switchMap('map_2').count).toBe(1);
    expect(manager.currentManager?.count).toBe(1);
  });

  it('loads single map data, toggles visibility flags, and clears all maps', () => {
    const manager = new ElectricPoleMapDataManager(createMapDataManager());

    manager.loadMapData('map_1', [createPole(1), createPole(2, 'zipline_80', [1])]);
    expect(manager.getMapManager('map_1').count).toBe(2);

    manager.setVisible(false);
    manager.setZoneVisible(false);
    manager.setDeviceVisible('pole', true);
    manager.setMapDeviceVisible('map_2', 'zipline_80', true);
    manager.importVisibilityData([{ mapId: 'map_1', entityKey: 'pole', visible: false }]);

    expect(manager.visible).toBe(false);
    expect(manager.zoneVisible).toBe(false);
    expect(manager.getDeviceVisible('pole')).toBe(false);

    manager.clearAllMaps();
    expect(manager.getMapManager('map_1').count).toBe(0);
    expect(manager.getMapManager('map_2').count).toBe(0);
  });
});
