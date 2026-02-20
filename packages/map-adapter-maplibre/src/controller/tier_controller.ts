import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { TierDataManager } from '@endfieldmap/map-core/data/tier';
import type { ITierController } from '@endfieldmap/map-core/interfaces/controllers';
import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';
import type { MapData } from '@endfieldmap/map-core/types/map';
import type { GridTierItem } from '@endfieldmap/map-core/types/tier';
import { action, observable } from 'mobx';

export interface TierControllerConfig {
  mapDataManager: MapDataManager;
}

/**
 * MapLibre 分级控制器
 * 管理网格分级数据，渲染由 React 组件驱动
 */
export class TierController implements ITierController {
  public readonly tierDataManager: TierDataManager;

  @observable accessor dataVersion = 0;

  constructor(config: TierControllerConfig) {
    this.tierDataManager = new TierDataManager(config.mapDataManager);
  }

  @action
  private bumpVersion(): void {
    this.dataVersion++;
  }

  addTier(mapId: MapData['id'], data: GridTierItem): void {
    this.tierDataManager.addTier(mapId, data);
    this.bumpVersion();
  }

  async renderTier(mapId: MapData['id'], center: MapCoordinate, id: string, subId?: string): Promise<void> {
    this.tierDataManager.setActiveTier(mapId, id, subId);
    this.bumpVersion();
    void center;
  }

  async toggleTier(mapId: MapData['id'], center: MapCoordinate, id: string, subId?: string): Promise<void> {
    if (this.tierDataManager.activeTier === id && this.tierDataManager.activeSubTier === (subId ?? null)) {
      this.clearTier();
    } else {
      await this.renderTier(mapId, center, id, subId);
    }
  }

  @action
  clearTier(): void {
    this.tierDataManager.clearActiveTier();
    this.bumpVersion();
  }

  dispose(): void {
    this.clearTier();
  }
}
