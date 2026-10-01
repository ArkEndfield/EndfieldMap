import { type GridTierItem, TierDataManager, type TierVolume } from '@endfieldmap/map-core';
import { observable, runInAction } from 'mobx';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type PlayerPosition, playerPositionStore } from '@/services/player_position_store';
import uiManager from '@/services/ui_manager';

import { followPlayerTier } from './use_player_tier';

vi.mock('@/services/player_position_store', async () => {
  const mobx = await import('mobx');
  return { playerPositionStore: mobx.observable({ enabled: true, followTier: true, position: null }) };
});
vi.mock('@/services/ui_manager', async () => {
  const mobx = await import('mobx');
  return { default: { enableTier: mobx.observable({ value: true }) } };
});

const LEVEL_MAPS: Record<string, string> = { map01_lv001: 'map_1', map02_lv001: 'map_2' };
const disposers: (() => void)[] = [];

function tier(id: string, regionIds: number[]): GridTierItem {
  return {
    id,
    name: id,
    level: 1,
    lb: [0, 0],
    rt: [10, 10],
    center: [5, 5],
    items: regionIds.map((regionId, index) => ({
      id: `${id}_${index}`,
      name: `${id}_${index}`,
      imagePath: `${id}_${index}`,
      regionId,
      level: 1,
      index,
    })),
  };
}

function volume(regionId: number, yMin: number, yMax: number): TierVolume {
  return {
    regionId,
    priority: 0,
    shapes: [{ type: 'box', x: 0, z: 0, yaw: 0, yMin, yMax, halfX: 50, halfZ: 50 }],
  };
}

/** 关卡里的某个高度：-10 在洞穴（cave_0 / mine_0），20 在上层（cave_1），0 在地表 */
function at(levelId: string, y: number, x = 0): PlayerPosition {
  return { mapId: LEVEL_MAPS[levelId], levelId, x, y, z: 0, updatedAt: 0 };
}

function moveTo(position: PlayerPosition | null): void {
  runInAction(() => {
    playerPositionStore.position = position;
  });
}

function setup({ volumes = true } = {}) {
  const view = observable({ currentMapId: 'map_1' });
  const dataManager = {
    get currentMapId() {
      return view.currentMapId;
    },
    xyz2crd: (position: { x: number; z: number }) => [position.x, position.z],
    getMapIdByLevelKey: (levelId: string) => LEVEL_MAPS[levelId],
  };
  const tierDataManager = new TierDataManager(dataManager as never);
  tierDataManager.addTier('map_1', tier('cave', [101, 102]));
  tierDataManager.addTier('map_2', tier('mine', [201]));
  if (volumes) {
    tierDataManager.setTierVolumes({
      map01_lv001: [volume(101, -30, -5), volume(102, 10, 40)],
      map02_lv001: [volume(201, -30, -5)],
    });
  }
  const tierController = {
    tierDataManager,
    showTier: vi.fn(async (mapId: string, id: string, subId?: string) => {
      tierDataManager.clearActiveTier();
      tierDataManager.setActiveTier(mapId, id, subId);
    }),
    clearTier: vi.fn(() => tierDataManager.clearActiveTier()),
  };
  const stop = followPlayerTier({ tierController, mapController: { dataManager } } as never);
  disposers.push(stop);
  const switchMap = (mapId: string) =>
    runInAction(() => {
      view.currentMapId = mapId;
    });
  return { tierController, tierDataManager, stop, switchMap };
}

describe('followPlayerTier', () => {
  beforeEach(() => {
    runInAction(() => {
      playerPositionStore.enabled = true;
      playerPositionStore.followTier = true;
      playerPositionStore.position = null;
      uiManager.enableTier.value = true;
    });
  });

  afterEach(() => {
    disposers.splice(0).forEach((dispose) => dispose());
  });

  it('opens the tier the player enters and closes it on the way back to the surface', () => {
    const { tierController, tierDataManager } = setup();

    moveTo(at('map01_lv001', 0));
    expect(tierController.showTier).not.toHaveBeenCalled();

    moveTo(at('map01_lv001', -10));
    expect(tierController.showTier).toHaveBeenLastCalledWith('map_1', 'cave', 'cave_0');

    moveTo(at('map01_lv001', 20));
    expect(tierController.showTier).toHaveBeenLastCalledWith('map_1', 'cave', 'cave_1');

    moveTo(at('map01_lv001', 0));
    expect(tierController.clearTier).toHaveBeenCalledTimes(1);
    expect(tierDataManager.activeTier).toBeNull();
  });

  it('leaves tiers the user closed or switched to alone', () => {
    const { tierController, tierDataManager } = setup();

    moveTo(at('map01_lv001', -10));
    tierDataManager.clearActiveTier();
    // 还在同一个分层里走动，不再重新打开
    moveTo(at('map01_lv001', -10, 5));
    expect(tierController.showTier).toHaveBeenCalledTimes(1);

    tierDataManager.setActiveTier('map_1', 'cave', 'cave_1');
    // 回到地表时只收起跟随打开的那一层，用户自己换的不动
    moveTo(at('map01_lv001', 0));
    expect(tierController.clearTier).not.toHaveBeenCalled();
    expect(tierDataManager.activeSubTier).toBe('cave_1');
  });

  it('only follows on the map being viewed', () => {
    const { tierController, tierDataManager, switchMap } = setup();

    tierDataManager.setActiveTier('map_1', 'cave', 'cave_0');
    moveTo(at('map02_lv001', 0));
    moveTo(at('map02_lv001', -10));
    expect(tierController.showTier).not.toHaveBeenCalled();
    expect(tierController.clearTier).not.toHaveBeenCalled();

    switchMap('map_2');
    expect(tierController.showTier).toHaveBeenLastCalledWith('map_2', 'mine', 'mine_0');
  });

  it('does nothing while following is off and catches up when it is turned on', () => {
    const { tierController } = setup();

    runInAction(() => {
      playerPositionStore.followTier = false;
    });
    moveTo(at('map01_lv001', -10));
    runInAction(() => {
      playerPositionStore.followTier = true;
      uiManager.enableTier.value = false;
    });
    expect(tierController.showTier).not.toHaveBeenCalled();

    runInAction(() => {
      uiManager.enableTier.value = true;
    });
    expect(tierController.showTier).toHaveBeenLastCalledWith('map_1', 'cave', 'cave_0');
  });

  it('does nothing when the tier cannot be told from the position', () => {
    const withoutVolumes = setup({ volumes: false });
    moveTo(at('map01_lv001', -10));
    withoutVolumes.stop();
    expect(withoutVolumes.tierController.showTier).not.toHaveBeenCalled();

    moveTo(null);
    const { tierController } = setup();
    moveTo({ ...at('map01_lv001', -10), levelId: '' });
    expect(tierController.showTier).not.toHaveBeenCalled();
  });

  it('stops following once disposed', () => {
    const { tierController, stop } = setup();

    stop();
    moveTo(at('map01_lv001', -10));
    expect(tierController.showTier).not.toHaveBeenCalled();
  });
});
