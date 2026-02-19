import { type GridTierItem, MAP_EVENT, type MapCoordinate, type MapData } from '@endfieldmap/map-core';
import type { GridTiersData } from '@endfieldmap/map-service/@types/grid_tiers';
import { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
import { type JSONLoader } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';

export class GridTiersDataService {
  private jsonLoader: JSONLoader;
  private assetService: AssetService;
  private adapterRegistry: AdapterRegistry;
  private disposeFn: (() => void) | null = null;
  @observable accessor gridTiersData: Record<MapData['id'], GridTierItem[]> = {};
  @observable accessor availableTier: string | null = null;

  constructor(jsonLoader: JSONLoader, adapterRegistry: AdapterRegistry, assetService: AssetService) {
    this.jsonLoader = jsonLoader;
    this.adapterRegistry = adapterRegistry;
    this.assetService = assetService;
  }

  @action
  public async init() {
    this.gridTiersData = this.adapterRegistry.adapter.mapController.dataManager.mapIds.reduce(
      (acc, mapId) => {
        acc[mapId] = [];
        return acc;
      },
      {} as Record<MapData['id'], GridTierItem[]>
    );
    const assetUrl = this.assetService.url;
    const gridTiersJsonData = await this.jsonLoader.loadJSON<GridTiersData>(
      `${assetUrl.tierData}/grid_tiers.json`
    );
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
          imagePath: `${assetUrl.tierImage}/${imagePath}.png`,
          level: 2,
          index,
        })),
      };
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
      this.adapterRegistry.adapter.tierController.addTier(mapId, tierData);
      this.gridTiersData[mapId].push(tierData);
    });

    const initialCenter = this.adapterRegistry.adapter.mapController.getCenter();
    this.updateAvailableTiers(initialCenter);

    this.disposeFn = this.adapterRegistry.adapter.event.on(MAP_EVENT.MAP_CENTER_CHANGE, (center) => {
      this.updateAvailableTiers(center);
    });
  }

  public dispose() {
    this.disposeFn?.();
    this.disposeFn = null;
  }

  @action
  private updateAvailableTiers(center: MapCoordinate | undefined) {
    if (!center || !Array.isArray(center)) return;

    const [crdX, crdY] = center;
    const mapDataManager = this.adapterRegistry.adapter.mapController.dataManager;
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
    const mapDataManager = this.adapterRegistry.adapter.mapController.dataManager;
    const mapId = mapDataManager.currentMapId;
    return this.gridTiersData[mapId].find((tier) => tier.id === this.availableTier);
  }

  @computed
  get activeTierData() {
    const mapDataManager = this.adapterRegistry.adapter.mapController.dataManager;
    const mapId = mapDataManager.currentMapId;
    const id = this.adapterRegistry.adapter.tierController.tierDataManager.activeTier;
    if (!id) return null;
    return this.gridTiersData[mapId].find((tier) => tier.id === id);
  }

  @computed
  get currentTierData() {
    const mapDataManager = this.adapterRegistry.adapter.mapController.dataManager;
    const mapId = mapDataManager.currentMapId;
    return this.gridTiersData[mapId];
  }

  @computed
  get activeSubTierData() {
    const id = this.adapterRegistry.adapter.tierController.tierDataManager.activeSubTier;
    if (!id) return null;
    return this.activeTierData?.items.find((tier) => tier.id === id);
  }
}
