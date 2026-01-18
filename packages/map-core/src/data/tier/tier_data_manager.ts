import { makeObservable, action, computed } from 'mobx';
import { TierDataInstance } from './tier_data_instance';
import type { TierData, TierRegion } from '../../types/tier';

export class TierDataManager {
  private _tiers: Map<string, TierDataInstance> = new Map();
  private _regions: Map<string, TierRegion> = new Map();
  private _currentActiveTier: Map<string, TierDataInstance | null> = new Map();

  constructor() {
    makeObservable(this, {
      addTier: action,
      removeTier: action,
      setActiveTier: action,
      clearActiveTier: action,
      getActiveTier: action,
      tiers: computed,
    });
  }

  private getRegionKey(mapIndex: string, x: number, y: number): string {
    return `${mapIndex}_${x}_${y}`;
  }

  addTier(data: TierData): TierDataInstance {
    const instance = new TierDataInstance(data);
    this._tiers.set(instance.id, instance);

    const regionKey = this.getRegionKey(data.mapIndex, data.x, data.y);
    let region = this._regions.get(regionKey);

    if (!region) {
      region = {
        mapIndex: data.mapIndex,
        x: data.x,
        y: data.y,
        tiers: [],
      };
      this._regions.set(regionKey, region);
    }

    region.tiers.push(data);
    region.tiers.sort((a, b) => a.level - b.level);

    return instance;
  }

  removeTier(id: string): void {
    const tier = this._tiers.get(id);
    if (!tier) return;

    this._tiers.delete(id);

    const regionKey = this.getRegionKey(tier.mapIndex, tier.x, tier.y);
    const region = this._regions.get(regionKey);
    if (region) {
      region.tiers = region.tiers.filter((t) => t.id !== id);
      if (region.tiers.length === 0) {
        this._regions.delete(regionKey);
      }
    }

    const activeRegionKey = `${tier.mapIndex}_${tier.x}_${tier.y}`;
    if (this._currentActiveTier.get(activeRegionKey)?.id === id) {
      this._currentActiveTier.delete(activeRegionKey);
    }
  }

  setActiveTier(mapIndex: string, x: number, y: number, level: number): void {
    const regionKey = this.getRegionKey(mapIndex, x, y);
    const region = this._regions.get(regionKey);

    if (!region) return;

    const tier = region.tiers.find((t) => t.level === level);
    if (!tier) return;

    const instance = this._tiers.get(tier.id);
    if (instance) {
      this._currentActiveTier.set(regionKey, instance);
    }
  }

  clearActiveTier(mapIndex: string, x: number, y: number): void {
    const regionKey = this.getRegionKey(mapIndex, x, y);
    this._currentActiveTier.delete(regionKey);
  }

  getActiveTier(mapIndex: string, x: number, y: number): TierDataInstance | null {
    const regionKey = this.getRegionKey(mapIndex, x, y);
    return this._currentActiveTier.get(regionKey) || null;
  }

  getTiersByRegion(mapIndex: string, x: number, y: number): TierData[] {
    const regionKey = this.getRegionKey(mapIndex, x, y);
    const region = this._regions.get(regionKey);
    return region ? [...region.tiers] : [];
  }

  get tiers(): TierDataInstance[] {
    return Array.from(this._tiers.values());
  }

  getAllActiveTiers(): TierDataInstance[] {
    return Array.from(this._currentActiveTier.values()).filter((tier): tier is TierDataInstance => tier !== null);
  }
}
