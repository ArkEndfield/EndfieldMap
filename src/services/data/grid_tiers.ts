import { crd2xyz, type Coordinate, type JSONLoader } from '@endfieldmap/tools';

import { getAssetUrls } from '@/utils/url';
import { MAP_EVENT, type EndfieldMapAdapter, type GridTierItem, MapIndex } from '@endfieldmap/map-core';
import type { GridTiersData } from '@/@types/grid_tiers';
import { action, computed, observable } from 'mobx';

const assetPath = getAssetUrls();

export class GridTiersDataService {
  private jsonLoader: JSONLoader;
  private adapter: EndfieldMapAdapter;
  private disposeFn: (() => void) | null = null;
  // TODO: 自动化
  @observable accessor gridTiersData: Record<MapIndex, GridTierItem[]> = {
    [MapIndex.MAP01]: [],
    [MapIndex.MAP02]: [],
  };
  @observable accessor availableTier: string | null = null;

  constructor(jsonLoader: JSONLoader, adapter: EndfieldMapAdapter) {
    this.jsonLoader = jsonLoader;
    this.adapter = adapter;
  }

  @action
  public async init() {
    const gridTiersJsonData = await this.jsonLoader.loadJSON<GridTiersData>(`${assetPath.tierData}/grid_tiers.json`);
    Object.entries(gridTiersJsonData).forEach(([id, gridData]) => {
      const tierData: GridTierItem = {
        id,
        name: id,
        level: 1,
        lb: gridData.lb,
        rt: gridData.rt,
        center: gridData.center,
        items: Object.entries(gridData.items).map(([name, imagePath], index) => ({
          id: name,
          name,
          imagePath: `${assetPath.tierImage}/${imagePath}.png`,
          level: 2,
          index,
        })),
      };
      let mapIndex: MapIndex;
      if (id.startsWith('map01')) {
        mapIndex = MapIndex.MAP01;
      } else if (id.startsWith('map02')) {
        mapIndex = MapIndex.MAP02;
      } else {
        return;
      }
      this.adapter.tierController.addTier(mapIndex, tierData);
      this.gridTiersData[mapIndex].push(tierData);
    });

    const initialCenter = this.adapter.mapController.getCenter();
    this.updateAvailableTiers(initialCenter);

    this.disposeFn = this.adapter.event.on(MAP_EVENT.MAP_CENTER_CHANGE, (center) => {
      this.updateAvailableTiers(center);
    });
  }

  public dispose() {
    this.disposeFn?.();
    this.disposeFn = null;
  }

  @action
  private updateAvailableTiers(center: Coordinate | undefined) {
    if (!center) return;

    const [crdX, crdY] = center;
    const xyzPos = crd2xyz([crdX, crdY], this.adapter.currentMapIndex);
    const gameX = xyzPos.x;
    const gameY = xyzPos.z;
    const mapIndex = this.adapter.currentMapIndex;

    for (const [, gridData] of Object.entries(this.gridTiersData[mapIndex])) {
      const [lbX, lbY] = gridData.lb;
      const [rtX, rtY] = gridData.rt;

      if (gameX >= lbX && gameX <= rtX && gameY >= lbY && gameY <= rtY) {
        if (this.availableTier !== gridData.id) {
          this.availableTier = gridData.id;
        }
        return;
      }
    }
  }

  @computed
  get availableTierData() {
    return this.gridTiersData[this.adapter.currentMapIndex].find((tier) => tier.id === this.availableTier);
  }

  @computed
  get activeTierData() {
    const id = this.adapter.tierController.tierDataManager.activeTier;
    if (!id) return null;
    return this.gridTiersData[this.adapter.currentMapIndex].find((tier) => tier.id === id);
  }

  @computed
  get currentTierData() {
    return this.gridTiersData[this.adapter.currentMapIndex];
  }

  @computed
  get activeSubTierData() {
    const id = this.adapter.tierController.tierDataManager.activeSubTier;
    if (!id) return null;
    return this.activeTierData?.items.find((tier) => tier.id === id);
  }
}
