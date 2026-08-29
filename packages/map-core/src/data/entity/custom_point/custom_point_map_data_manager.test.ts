import type { CustomPointData } from '@endfieldmap/map-core/types/entity';
import { describe, expect, it } from 'vitest';

import { CustomPointMapDataManager } from './custom_point_map_data_manager';

function createMapDataManager() {
  return {
    currentMapId: 'map_1',
    mapIds: ['map_1', 'map_2'],
    xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
  } as never;
}

function createPoint(id: number, typeId: 'custom_point_1' | 'custom_point_2' = 'custom_point_1'): CustomPointData {
  return {
    levelLogicId: id,
    entityDataIdKey: typeId,
    templateId: '#custom_point',
    entityType: '#CustomPoint',
    position: { x: id, y: 0, z: id + 1 },
    properties: {},
  };
}

describe('CustomPointMapDataManager', () => {
  it('initializes managers for known maps and exposes current manager', () => {
    const manager = new CustomPointMapDataManager(createMapDataManager());

    expect(manager.mapManagers.has('map_1')).toBe(true);
    expect(manager.mapManagers.has('map_2')).toBe(true);
    expect(manager.currentManager).toBe(manager.getMapManager('map_1'));
  });

  it('loads and exports map data', () => {
    const manager = new CustomPointMapDataManager(createMapDataManager());

    manager.loadData({
      map_1: [createPoint(1)],
      map_2: [createPoint(2, 'custom_point_2')],
    });

    expect(manager.getMapManager('map_1').count).toBe(1);
    expect(manager.getMapManager('map_2').count).toBe(1);
    expect(manager.allData.map_1?.[0]?.levelLogicId).toBe(1);
    expect(manager.allData.map_2?.[0]?.entityDataIdKey).toBe('custom_point_2');
  });

  it('loads single-map data, clears maps, and imports visibility state', () => {
    const manager = new CustomPointMapDataManager(createMapDataManager());

    manager.loadMapData('map_1', [createPoint(1), createPoint(2)]);
    expect(manager.getMapManager('map_1').count).toBe(2);

    manager.setVisible(false);
    manager.setTypeVisible('custom_point_1', true);
    manager.setMapTypeVisible('map_2', 'custom_point_2', true);
    manager.importVisibilityData([{ mapId: 'map_1', entityKey: 'custom_point_1', visible: false }]);

    expect(manager.visible).toBe(false);
    expect(manager.getTypeVisible('custom_point_1')).toBe(false);

    manager.clearAllMaps();
    expect(manager.getMapManager('map_1').count).toBe(0);
    expect(manager.getMapManager('map_2').count).toBe(0);
  });
});
