import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { TierDataInstance } from '@endfieldmap/map-core/data/tier/tier_data_instance';
import { locateTierVolume } from '@endfieldmap/map-core/data/tier/tier_locator';
import type { MapData } from '@endfieldmap/map-core/types/map';
import type { Position } from '@endfieldmap/map-core/types/position';
import type { GridTierItem, TierRegionRef, TierVolume } from '@endfieldmap/map-core/types/tier';
import { action, makeObservable, observable } from 'mobx';

export class TierDataManager {
  public tiers: Map<MapData['id'], Map<string, Map<string, TierDataInstance>>> = new Map();
  /** Tier 区域 ID（标点 mapRegionId）-> 所在分层图层定位信息 */
  private tierRegions: Map<number, TierRegionRef> = new Map();
  /** 关卡 ID -> 该关卡的 Tier 体积（tier_volumes.json）；未载入时为空，无法按坐标判定分层 */
  @observable.ref accessor tierVolumes: ReadonlyMap<string, readonly TierVolume[]> = new Map();
  @observable accessor activeTier: string | null = null;
  @observable accessor activeSubTier: string | null = null;
  public readonly mapDataManager: MapDataManager;

  constructor(mapDataManager: MapDataManager) {
    this.mapDataManager = mapDataManager;
    makeObservable(this, {
      addTier: action,
      removeTier: action,
      setTierVolumes: action,
      setActiveTier: action,
      clearActiveTier: action,
    });
  }

  addTier(mapId: MapData['id'], data: GridTierItem): Map<string, TierDataInstance> {
    const regionKey = data.id;
    const items = data.items;
    const instances = new Map<string, TierDataInstance>();
    const position: [number, number] = [data.lb[0], data.lb[1]];

    for (const item of items) {
      // 有精确范围时锚在图片自身的左下角：一组里的多张分层图不一定都从分组 lb 开始
      const itemPosition: [number, number] = item.bounds ? [item.bounds.lb[0], item.bounds.lb[1]] : position;
      const instance = new TierDataInstance(mapId, item, itemPosition, this.mapDataManager);
      instances.set(instance.id, instance);
      this.tierRegions.set(item.regionId, { mapId, tierId: regionKey, subTierId: item.id });
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

  /** 载入各关卡的 Tier 体积（tier_volumes.json 的 levels） */
  setTierVolumes(levels: Record<string, TierVolume[]>): void {
    this.tierVolumes = new Map(Object.entries(levels));
  }

  /** 是否已载入 Tier 体积；未载入时无法按坐标判定分层 */
  get hasTierVolumes(): boolean {
    return this.tierVolumes.size > 0;
  }

  /**
   * 按三维游戏坐标判定所在的分层图：只看该关卡的体积，priority 最高者胜，同级取列表靠前者。
   * 所在分层没有叠加图时按地表处理。
   * @param levelId 所在关卡
   * @param position 游戏坐标，y 为高度
   * @returns 在地表时返回 null
   */
  public locateTierRegion(levelId: string, position: Position): TierRegionRef | null {
    const volume = locateTierVolume(this.tierVolumes.get(levelId) ?? [], position);
    return volume ? (this.tierRegions.get(volume.regionId) ?? null) : null;
  }

  /** 由标点的 mapRegionId 反查其所属的分层图层；0 或未映射的区域返回 undefined */
  public getTierRegion(regionId: number): TierRegionRef | undefined {
    return this.tierRegions.get(regionId);
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
