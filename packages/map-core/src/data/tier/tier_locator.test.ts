import type { TierVolume, TierVolumeBox } from '@endfieldmap/map-core/types/tier';
import { describe, expect, it } from 'vitest';

import { isInTierShape, locateTierVolume } from './tier_locator';

function box(x: number, z: number, yMin: number, yMax: number, half = 10, yaw = 0): TierVolumeBox {
  return { type: 'box', x, z, yaw, yMin, yMax, halfX: half, halfZ: half };
}

function volume(regionId: number, shape: TierVolume['shapes'][number], priority = 0): TierVolume {
  return { regionId, priority, shapes: [shape] };
}

describe('isInTierShape', () => {
  it('treats box bounds as inclusive and limits by height', () => {
    const shape = box(100, 50, 0, 20);

    expect(isInTierShape(shape, { x: 110, y: 20, z: 40 })).toBe(true);
    expect(isInTierShape(shape, { x: 110.01, y: 10, z: 50 })).toBe(false);
    expect(isInTierShape(shape, { x: 100, y: 20.01, z: 50 })).toBe(false);
    expect(isInTierShape(shape, { x: 100, y: -0.01, z: 50 })).toBe(false);
  });

  it('rotates the footprint by yaw like the data pipeline', () => {
    // 20 x 2 的盒体偏航 90°：世界 (dx, dz) 映射到局部 (-dz, dx)，所以它沿南北方向铺开
    const shape: TierVolumeBox = { type: 'box', x: 0, z: 0, yaw: 90, yMin: -1, yMax: 1, halfX: 10, halfZ: 1 };

    expect(isInTierShape(shape, { x: 0, y: 0, z: 9 })).toBe(true);
    expect(isInTierShape(shape, { x: 9, y: 0, z: 0 })).toBe(false);
  });

  it('tests polygons with the even-odd rule around the pivot', () => {
    // 以 (100, 100) 为枢轴的 L 形：局部 (5, 5) 处的缺口在外面
    const shape: TierVolume['shapes'][number] = {
      type: 'polygon',
      x: 100,
      z: 100,
      yaw: 0,
      yMin: 0,
      yMax: 5,
      points: [
        [0, 0],
        [10, 0],
        [10, 3],
        [3, 3],
        [3, 10],
        [0, 10],
      ],
    };

    expect(isInTierShape(shape, { x: 101, y: 1, z: 101 })).toBe(true);
    expect(isInTierShape(shape, { x: 108, y: 1, z: 101 })).toBe(true);
    expect(isInTierShape(shape, { x: 105, y: 1, z: 105 })).toBe(false);
    expect(isInTierShape(shape, { x: 101, y: 6, z: 101 })).toBe(false);
  });
});

describe('locateTierVolume', () => {
  it('tells stacked tiers apart by height', () => {
    const cave = volume(1, box(0, 0, -30, -5));
    const upper = volume(2, box(0, 0, 10, 40));

    expect(locateTierVolume([cave, upper], { x: 0, y: -10, z: 0 })).toBe(cave);
    expect(locateTierVolume([cave, upper], { x: 0, y: 20, z: 0 })).toBe(upper);
    expect(locateTierVolume([cave, upper], { x: 0, y: 0, z: 0 })).toBeNull();
  });

  it('picks the highest priority and gives ties to the first listed', () => {
    const first = volume(1, box(0, 0, 0, 10));
    const second = volume(2, box(0, 0, 0, 10));
    const important = volume(3, box(0, 0, 0, 10), 1);

    expect(locateTierVolume([first, second], { x: 0, y: 5, z: 0 })).toBe(first);
    expect(locateTierVolume([first, important, second], { x: 0, y: 5, z: 0 })).toBe(important);
  });

  it('matches when any shape of a volume contains the point', () => {
    const tier: TierVolume = { regionId: 1, priority: 0, shapes: [box(0, 0, 0, 10), box(100, 0, 0, 10)] };

    expect(locateTierVolume([tier], { x: 100, y: 5, z: 0 })).toBe(tier);
    expect(locateTierVolume([tier], { x: 50, y: 5, z: 0 })).toBeNull();
  });
});
