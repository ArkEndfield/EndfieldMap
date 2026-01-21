import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { TierDataInstance } from '@endfieldmap/map-core/data/tier/tier_data_instance';
import type { GridTierItem } from '@endfieldmap/map-core/types/tier';
import { action, makeObservable, observable } from 'mobx';

export class TierDataManager {
  public tiers: Map<MapIndex, Map<string, Map<string, TierDataInstance>>> = new Map();
  private currentMapIndex: MapIndex | null = null;
  @observable accessor activeTier: string | null = null;
  @observable accessor activeSubTier: string | null = null;

  constructor() {
    makeObservable(this, {
      addTier: action,
      removeTier: action,
      setActiveTier: action,
      clearActiveTier: action,
    });
  }

  addTier(mapIndex: MapIndex, data: GridTierItem): Map<string, TierDataInstance> {
    const regionKey = data.id;
    const items = data.items;
    const instances = new Map<string, TierDataInstance>();
    const position = [data.lb[0], data.lb[1]];

    for (const item of items) {
      const instance = new TierDataInstance(mapIndex, item, position);
      instances.set(instance.id, instance);
    }

    const mapIndexTiers = this.tiers.get(mapIndex);

    if (mapIndexTiers) {
      mapIndexTiers.set(regionKey, instances);
    } else {
      this.tiers.set(mapIndex, new Map([[regionKey, instances]]));
    }

    return instances;
  }

  removeTier(mapIndex: MapIndex, id: string): void {
    const mapTiers = this.tiers.get(mapIndex);
    if (!mapTiers) return;
    const tier = mapTiers.get(id);

    if (!tier) return;
    mapTiers.delete(id);

    if (this.activeTier === id) {
      this.clearActiveTier();
    }
  }

  setActiveTier(mapIndex: MapIndex, id: string, subId?: string): void {
    this.currentMapIndex = mapIndex;
    this.activeTier = id;

    if (subId) {
      this.activeSubTier = subId;
    } else {
      // 没有传 subId 时，默认取第一个子项
      const instance = this.tiers.get(mapIndex)?.get(id);
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
    const mapIndex = this.currentMapIndex;

    if (!id || !mapIndex || !subId) return null;

    const instance = this.tiers.get(mapIndex)?.get(id);

    if (!instance) return null;

    return instance.get(subId) ?? null;
  }
}
