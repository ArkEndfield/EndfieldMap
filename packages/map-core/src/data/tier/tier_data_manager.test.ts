import type { GridTierItem } from '@endfieldmap/map-core/types/tier';
import { describe, expect, it } from 'vitest';

import { TierDataManager } from './tier_data_manager';

function createMapDataManager() {
  return {
    currentMapId: 'map_1',
    xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
  } as never;
}

function createTier(id: string) {
  return {
    id,
    name: `Tier ${id}`,
    level: 1,
    lb: [10, 20] as [number, number],
    rt: [30, 40] as [number, number],
    center: [20, 30] as [number, number],
    items: [
      {
        id: `${id}_a`,
        name: 'A',
        imagePath: '/a.png',
        regionId: 101,
        level: 1,
        index: 1,
      },
      {
        id: `${id}_b`,
        name: 'B',
        imagePath: '/b.png',
        regionId: 102,
        level: 1,
        index: 2,
      },
    ],
  };
}

describe('TierDataManager', () => {
  it('adds tiers and returns item instances keyed by sub tier id', () => {
    const manager = new TierDataManager(createMapDataManager());

    const instances = manager.addTier('map_1' as never, createTier('region_1'));

    expect(instances.size).toBe(2);
    expect(instances.get('region_1_a')?.id).toBe('region_1_a');
    expect(manager.tiers.get('map_1')?.get('region_1')).toBe(instances);
  });

  it('indexes tier regions by mapRegionId', () => {
    const manager = new TierDataManager(createMapDataManager());
    manager.addTier('map_1' as never, createTier('region_1'));

    expect(manager.getTierRegion(101)).toEqual({
      mapId: 'map_1',
      tierId: 'region_1',
      subTierId: 'region_1_a',
    });
    expect(manager.getTierRegion(102)?.subTierId).toBe('region_1_b');
    expect(manager.getTierRegion(0)).toBeUndefined();
  });

  it('sets active tiers and defaults sub tier to the first item', () => {
    const manager = new TierDataManager(createMapDataManager());
    manager.addTier('map_1' as never, createTier('region_1'));

    manager.setActiveTier('map_1' as never, 'region_1');

    expect(manager.activeTier).toBe('region_1');
    expect(manager.activeSubTier).toBe('region_1_a');
    expect(manager.currentActiveTier?.id).toBe('region_1_a');

    manager.setActiveTier('map_1' as never, 'region_1', 'region_1_b');
    expect(manager.currentActiveTier?.id).toBe('region_1_b');
  });

  it('removes tiers and clears active state when needed', () => {
    const manager = new TierDataManager(createMapDataManager());
    manager.addTier('map_1' as never, createTier('region_1'));
    manager.setActiveTier('map_1' as never, 'region_1', 'region_1_a');

    manager.removeTier('map_1' as never, 'region_1');

    expect(manager.tiers.get('map_1')?.has('region_1')).toBe(false);
    expect(manager.activeTier).toBeNull();
    expect(manager.activeSubTier).toBeNull();
    expect(manager.currentActiveTier).toBeNull();
  });

  it('anchors each sub tier at its exact image bounds when known', () => {
    const manager = new TierDataManager(createMapDataManager());
    const tier: GridTierItem = createTier('region_1');
    tier.items[1] = { ...tier.items[1], bounds: { lb: [20, 20], rt: [30, 30] } };

    const instances = manager.addTier('map_1' as never, tier);

    expect(instances.get('region_1_a')?.extent).toEqual([10, 20, 10, 20]);
    expect(instances.get('region_1_b')?.extent).toEqual([20, 20, 30, 30]);
  });

  it('locates the tier region by level and 3D position', () => {
    const manager = new TierDataManager(createMapDataManager());
    manager.addTier('map_1' as never, createTier('region_1'));
    const box = { type: 'box' as const, x: 0, z: 0, yaw: 0, halfX: 10, halfZ: 10 };

    expect(manager.hasTierVolumes).toBe(false);
    manager.setTierVolumes({
      map_1_lv001: [
        { regionId: 101, priority: 0, shapes: [{ ...box, yMin: -30, yMax: -5 }] },
        { regionId: 102, priority: 0, shapes: [{ ...box, yMin: 10, yMax: 40 }] },
        // 没有叠加图的分层：判定到它时按地表处理
        { regionId: 999, priority: 0, shapes: [{ ...box, yMin: 50, yMax: 60 }] },
      ],
    });

    expect(manager.hasTierVolumes).toBe(true);
    expect(manager.locateTierRegion('map_1_lv001', { x: 0, y: -10, z: 0 })?.subTierId).toBe('region_1_a');
    expect(manager.locateTierRegion('map_1_lv001', { x: 0, y: 20, z: 0 })?.subTierId).toBe('region_1_b');
    expect(manager.locateTierRegion('map_1_lv001', { x: 0, y: 0, z: 0 })).toBeNull();
    expect(manager.locateTierRegion('map_1_lv001', { x: 0, y: 55, z: 0 })).toBeNull();
    // 体积只对自己的关卡生效
    expect(manager.locateTierRegion('map_1_lv002', { x: 0, y: -10, z: 0 })).toBeNull();
  });

  it('ignores missing tiers and clears active state manually', () => {
    const manager = new TierDataManager(createMapDataManager());

    manager.removeTier('map_1' as never, 'missing');
    manager.clearActiveTier();

    expect(manager.activeTier).toBeNull();
    expect(manager.activeSubTier).toBeNull();
    expect(manager.currentActiveTier).toBeNull();
  });
});
