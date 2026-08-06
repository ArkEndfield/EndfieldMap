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

  it('ignores missing tiers and clears active state manually', () => {
    const manager = new TierDataManager(createMapDataManager());

    manager.removeTier('map_1' as never, 'missing');
    manager.clearActiveTier();

    expect(manager.activeTier).toBeNull();
    expect(manager.activeSubTier).toBeNull();
    expect(manager.currentActiveTier).toBeNull();
  });
});
