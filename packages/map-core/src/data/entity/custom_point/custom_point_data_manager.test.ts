import { describe, expect, it } from 'vitest';

import type { CustomPointData } from '@endfieldmap/map-core/types/entity';

import { CustomPointDataManager } from './custom_point_data_manager';

function createPoint(id: number, typeId: 'custom_point_1' | 'custom_point_2' = 'custom_point_1'): CustomPointData {
  return {
    levelLogicId: id,
    entityDataIdKey: typeId,
    templateId: '#custom_point',
    entityType: '#CustomPoint' as const,
    position: { x: id, y: 0, z: id + 1 },
    properties: {},
  };
}

describe('CustomPointDataManager', () => {
  it('initializes instances, injects entityInfo, and applies type visibility', () => {
    const manager = new CustomPointDataManager({
      mapId: 'map_1' as never,
      initialData: [createPoint(1), createPoint(2, 'custom_point_2')],
      mapDataManager: {
        xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
      } as never,
    });

    expect(manager.count).toBe(2);
    expect(manager.instances[0]?.entityInfo.entityInfo.pic).toBe('icon_map_custom_mark_shadow_1');
    expect(manager.instances[0]?.visible).toBe(false);

    manager.setTypeVisible('custom_point_1', true);

    expect(manager.getTypeVisible('custom_point_1')).toBe(true);
    expect(manager.getByType('custom_point_1').map((item) => item.id)).toEqual([1]);
    expect(manager.instances[0]?.visible).toBe(true);
  });

  it('exports current instance data', () => {
    const manager = new CustomPointDataManager({
      mapId: 'map_1' as never,
      initialData: [createPoint(1)],
      mapDataManager: {
        xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
      } as never,
    });

    manager.instances[0]?.rename('Exported');

    expect(manager.exportData).toEqual([
      expect.objectContaining({
        levelLogicId: 1,
        properties: expect.objectContaining({ name: 'Exported' }),
      }),
    ]);
  });
});
