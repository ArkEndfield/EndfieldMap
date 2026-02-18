import {
  type Coordinate,
  type EndfieldMapAdapter,
  type GridTierItem,
  MAP_EVENT,
  type MapData,
} from '@endfieldmap/map-core';
import { type JSONLoader } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';

import type { GridTiersData } from '@/@types/grid_tiers';
import { service } from '@/services';

const assetPath = service.assetService.url;

export class GridTiersDataService {
  private jsonLoader: JSONLoader;
  private adapter: EndfieldMapAdapter;
  private disposeFn: (() => void) | null = null;
  // TODO: 自动化
  @observable accessor gridTiersData: Record<MapData['id'], GridTierItem[]>;
  @observable accessor availableTier: string | null = null;

  constructor(jsonLoader: JSONLoader, adapter: EndfieldMapAdapter) {
    this.jsonLoader = jsonLoader;
    this.adapter = adapter;
    this.gridTiersData = this.adapter.mapController.dataManager.mapIds.reduce(
      (acc, mapId) => {
        acc[mapId] = [];
        return acc;
      },
      {} as Record<MapData['id'], GridTierItem[]>
    );
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
      // TODO: 智能读取
      let mapId: MapData['id'];
      if (id.startsWith('map01')) {
        mapId = 'map01';
      } else if (id.startsWith('map02')) {
        mapId = 'map02';
      } else if (id.startsWith('dung01')) {
        mapId = 'dung01';
      } else {
        return;
      }
      this.adapter.tierController.addTier(mapId, tierData);
      this.gridTiersData[mapId].push(tierData);
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
    if (!center || !Array.isArray(center)) return;

    const [crdX, crdY] = center;
    const mapDataManager = this.adapter.mapController.dataManager;
    const mapId = mapDataManager.currentMapId;
    const xyzPos = mapDataManager.crd2xyz([crdX, crdY], mapId);
    const gameX = xyzPos.x;
    const gameY = xyzPos.z;

    for (const [, gridData] of Object.entries(this.gridTiersData[mapId])) {
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
    const mapDataManager = this.adapter.mapController.dataManager;
    const mapId = mapDataManager.currentMapId;
    return this.gridTiersData[mapId].find((tier) => tier.id === this.availableTier);
  }

  @computed
  get activeTierData() {
    const mapDataManager = this.adapter.mapController.dataManager;
    const mapId = mapDataManager.currentMapId;
    const id = this.adapter.tierController.tierDataManager.activeTier;
    if (!id) return null;
    return this.gridTiersData[mapId].find((tier) => tier.id === id);
  }

  @computed
  get currentTierData() {
    const mapDataManager = this.adapter.mapController.dataManager;
    const mapId = mapDataManager.currentMapId;
    return this.gridTiersData[mapId];
  }

  @computed
  get activeSubTierData() {
    const id = this.adapter.tierController.tierDataManager.activeSubTier;
    if (!id) return null;
    return this.activeTierData?.items.find((tier) => tier.id === id);
  }
}
