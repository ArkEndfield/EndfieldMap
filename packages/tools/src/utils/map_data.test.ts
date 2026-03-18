import { describe, expect, it } from 'vitest';

import { calculateDistance, calculateXYZDistance } from './map_data';

describe('map_data utilities', () => {
  it('calculates 2d euclidean distance', () => {
    expect(calculateDistance([0, 0], [3, 4])).toBe(5);
    expect(calculateDistance([2, 2], [2, 2])).toBe(0);
  });

  it('calculates xz-plane distance for xyz coordinates', () => {
    expect(calculateXYZDistance({ x: 0, y: 10, z: 0 }, { x: 6, y: -5, z: 8 })).toBe(10);
    expect(calculateXYZDistance({ x: 1, y: 1, z: 1 }, { x: 1, y: 9, z: 1 })).toBe(0);
  });
});
