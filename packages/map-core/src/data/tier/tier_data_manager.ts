import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { TierDataInstance } from '@endfieldmap/map-core/data/tier/tier_data_instance';
import type { MapData } from '@endfieldmap/map-core/types/map';
import type { GridTierItem } from '@endfieldmap/map-core/types/tier';
import { action, makeObservable, observable } from 'mobx';

export class TierDataManager {
  public tiers: Map<MapData['id'], Map<string, Map<string, TierDataInstance>>> = new Map();
  @observable accessor activeTier: string | null = null;
  @observable accessor activeSubTier: string | null = null;
  public readonly mapDataManager: MapDataManager;

  constructor(mapDataManager: MapDataManager) {
    this.mapDataManager = mapDataManager;
    makeObservable(this, {
      addTier: action,
      removeTier: action,
      setActiveTier: action,
      clearActiveTier: action,
    });
  }

  addTier(mapId: MapData['id'], data: GridTierItem): Map<string, TierDataInstance> {
    const regionKey = data.id;
    const items = data.items;
    const instances = new Map<string, TierDataInstance>();
    const position = [data.lb[0], data.lb[1]];

    for (const item of items) {
      const instance = new TierDataInstance(mapId, item, position, this.mapDataManager);
      instances.set(instance.id, instance);
    }

    const mapIdTiers = this.tiers.get(mapId);

    if (mapIdTiers) {
      mapIdTiers.set(regionKey, instances);
    } else {
      this.tiers.set(mapId, new Map([[regionKey, instances]]));
    }

    return instances;
  }

  removeTier(mapId: MapData['id'], id: string): void {
    const mapTiers = this.tiers.get(mapId);
    if (!mapTiers) return;
    const tier = mapTiers.get(id);

    if (!tier) return;
    mapTiers.delete(id);

    if (this.activeTier === id) {
      this.clearActiveTier();
    }
  }

  setActiveTier(mapId: MapData['id'], id: string, subId?: string): void {
    this.activeTier = id;

    if (subId) {
      this.activeSubTier = subId;
    } else {
      // 没有传 subId 时，默认取第一个子项
      const instance = this.tiers.get(mapId)?.get(id);
      if (instance && instance.size > 0) {
        const firstKey = instance.keys().next().value;
        if (firstKey) {
          this.activeSubTier = firstKey;
        }
      }
    }
  }

  clearActiveTier() {
    this.activeTier = null;
    this.activeSubTier = null;
  }

  get currentActiveTier(): TierDataInstance | null {
    const id = this.activeTier;
    const subId = this.activeSubTier;
    const mapId = this.mapDataManager.currentMapId;

    if (!id || !mapId || !subId) return null;

    const instance = this.tiers.get(mapId)?.get(id);

    if (!instance) return null;

    return instance.get(subId) ?? null;
  }
}
