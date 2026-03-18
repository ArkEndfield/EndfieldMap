import { describe, expect, it } from 'vitest';

import { TierDataInstance } from './tier_data_instance';

describe('TierDataInstance', () => {
  it('exposes basic tier item fields and computes extent', () => {
    const instance = new TierDataInstance(
      'map_1' as never,
      {
        id: 'sub_1',
        name: 'Sub Tier',
        imagePath: '/tier.png',
        level: 1,
        index: 7,
      },
      [10, 20],
      {
        xyz2crd: (position: { x: number; z: number }) => [position.x + 1, position.z + 2],
      } as never
    );

    expect(instance.id).toBe('sub_1');
    expect(instance.imageUrl).toBe('/tier.png');
    expect(instance.index).toBe(7);
    expect(instance.x).toBe(10);
    expect(instance.y).toBe(20);
    expect(instance.extent).toEqual([11, 22, 11, 22]);

    instance.setExtentExtra([5, 6]);
    expect(instance.extent).toEqual([11, 22, 16, 28]);
  });
});
