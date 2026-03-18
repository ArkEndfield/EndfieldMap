import { describe, expect, it } from 'vitest';

import { getCustomPointEntityInfo } from './custom_point_config';
import { CustomPointDataInstance } from './custom_point_data_instance';

function createInstance(typeId: 'custom_point_1' | 'custom_point_2' = 'custom_point_1') {
  return new CustomPointDataInstance({
    data: {
      levelLogicId: 1,
      entityDataIdKey: typeId,
      templateId: '#custom_point',
      entityType: '#CustomPoint',
      position: { x: 10, y: 0, z: 20 },
      properties: {},
      entityInfo: getCustomPointEntityInfo(typeId),
    },
    mapId: 'map_1' as never,
    mapDataManager: {
      xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
    } as never,
  });
}

describe('CustomPointDataInstance', () => {
  it('exposes coordinates, icon, and default name', () => {
    const instance = createInstance();

    expect(instance.coordinates).toEqual([10, 20]);
    expect(instance.iconName).toBe('icon_map_custom_mark_shadow_1');
    expect(instance.name).toBe('CustomPoint #1');
    expect(instance.markable).toBe(false);
    expect(instance.selectable).toBe(false);
    expect(instance.renameable).toBe(true);
    expect(instance.deletable).toBe(true);
  });

  it('renames and changes type with updated entity info', () => {
    const instance = createInstance();

    instance.rename('My Point');
    instance.changeType('custom_point_2');

    expect(instance.name).toBe('My Point');
    expect(instance.typeId).toBe('custom_point_2');
    expect(instance.iconName).toBe('icon_map_custom_mark_shadow_2');
  });

  it('rejects invalid custom point types and ignores marked/selected state changes', () => {
    const instance = createInstance();

    expect(() => instance.changeType('invalid_type' as never)).toThrow('Invalid custom point type: invalid_type');

    instance.setMarked(true);
    instance.setSelected(true);

    expect(instance.marked).toBe(false);
    expect(instance.selected).toBe(false);
  });
});
