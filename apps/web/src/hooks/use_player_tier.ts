import type { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import type { TierDataManager, TierRegionRef } from '@endfieldmap/map-core';
import { reaction } from 'mobx';
import { useEffect } from 'react';

import { type PlayerPosition, playerPositionStore } from '@/services/player_position_store';
import uiManager from '@/services/ui_manager';

/**
 * 玩家所在的分层图：按森空岛上报的三维坐标（y 为高度）和 tier_volumes.json 判定，
 * 规则与数据管线给标点分配 mapRegionId 的一致。
 * @returns 在地表（或所在分层没有叠加图）时为 null；没有分层体积数据或上报缺关卡时无从判定，为 undefined
 */
export function locatePlayerTier(
  tierDataManager: TierDataManager,
  position: PlayerPosition
): TierRegionRef | null | undefined {
  if (!tierDataManager.hasTierVolumes || !position.levelId) {
    return undefined;
  }
  return tierDataManager.locateTierRegion(position.levelId, position);
}

/**
 * 分层跟随：玩家进出洞穴、楼层等分层时，自动打开 / 收起对应的分层图，不移动视图。
 *
 * 只在玩家所在分层变化时动作：用户手动关掉或换成别的分层后不会被反复改回去；
 * 玩家回到地表时也只收起跟随打开的那一层。玩家不在当前查看的地图上时不动分层。
 * @returns 停止跟随
 */
export function followPlayerTier(adapter: EndfieldMapAdapter): () => void {
  const tierController = adapter.tierController;
  const tierDataManager = tierController.tierDataManager;
  const dataManager = adapter.mapController.dataManager;
  /** 跟随打开的分层；玩家回到地表时只收起它 */
  let followed: TierRegionRef | null = null;

  const isActive = (region: TierRegionRef): boolean =>
    region.tierId === tierDataManager.activeTier && region.subTierId === tierDataManager.activeSubTier;

  return reaction(
    () => {
      const position = playerPositionStore.position;
      if (!position || !playerPositionStore.enabled || !playerPositionStore.followTier || !uiManager.enableTier.value) {
        return undefined;
      }
      const region = locatePlayerTier(tierDataManager, position);
      const mapId = region ? region.mapId : (dataManager.getMapIdByLevelKey(position.levelId) ?? position.mapId);
      return mapId === dataManager.currentMapId ? region : undefined;
    },
    (region) => {
      if (region === undefined) {
        return;
      }
      if (region) {
        if (!isActive(region)) {
          void tierController.showTier(region.mapId, region.tierId, region.subTierId);
        }
      } else if (followed && isActive(followed)) {
        tierController.clearTier();
      }
      followed = region;
    },
    { fireImmediately: true }
  );
}

/** 在地图组件生命周期内跟随玩家所在分层（见 followPlayerTier） */
export function usePlayerTierFollow(adapter: EndfieldMapAdapter): void {
  useEffect(() => followPlayerTier(adapter), [adapter]);
}
