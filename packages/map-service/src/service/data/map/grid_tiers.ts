import {
  type GridTierItem,
  MAP_EVENT,
  type MapCoordinate,
  type MapData,
  type TierImageBounds,
} from '@endfieldmap/map-core';
import type { GridTiersData, TierVolumesData } from '@endfieldmap/map-service/@types/grid_tiers';
import { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
import { type JSONLoader, logger } from '@endfieldmap/tools';
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
    const mapDataManager = this.adapterRegistry.adapter.mapController.dataManager;
    const [gridTiersJsonData, tierVolumes] = await Promise.all([
      this.jsonLoader.loadJSON<GridTiersData>(`${assetUrl.tierData}/grid_tiers.json`),
      this.loadTierVolumes(`${assetUrl.tierData}/tier_volumes.json`),
    ]);
    // 图片 stem -> 该分层图精确覆盖的范围
    const imageBounds = new Map<string, TierImageBounds>();
    for (const volumes of Object.values(tierVolumes?.levels ?? {})) {
      for (const { image } of volumes) {
        if (image) imageBounds.set(image.stem, { lb: image.lb, rt: image.rt });
      }
    }
    Object.entries(gridTiersJsonData).forEach(([id, gridData]) => {
      // key 是 `${关卡ID}_${x}_${y}`，地图 ID 可能自带下划线（indie_dg007），按最长地图 ID 前缀归图
      const mapId = mapDataManager.getMapIdByLevelKey(id);
      if (mapId === undefined) {
        logger.warn('[GridTiersDataService] grid tier of unknown map, skipped:', id);
        return;
      }
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
          // 图片 stem 固定以 `_tier_{mapRegionId}` 结尾（见数据管线 tier_anchor / grid_coordinates）
          regionId: Number(/_tier_(\d+)$/.exec(imagePath)![1]),
          level: 2,
          index,
          bounds: imageBounds.get(imagePath),
        })),
      };
      this.adapterRegistry.adapter.tierController.addTier(mapId, tierData);
      this.gridTiersData[mapId].push(tierData);
    });
    if (tierVolumes) {
      this.adapterRegistry.adapter.tierController.tierDataManager.setTierVolumes(tierVolumes.levels);
    }

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

  /**
   * tier_volumes.json 是可选数据（数据管线 maps v3 起才有）：取不到时照常显示分层，
   * 只是无法按坐标判定所在分层，分层图也退回按分组锚定。只请求一次，不让缺文件拖慢加载。
   */
  private async loadTierVolumes(url: string): Promise<TierVolumesData | null> {
    try {
      const data = await this.jsonLoader.loadJSON<TierVolumesData>(url, 1);
      if (data.version === 1) {
        return data;
      }
      logger.warn('[GridTiersDataService] unsupported tier_volumes.json version, ignored:', data.version);
    } catch (error) {
      logger.warn('[GridTiersDataService] tier_volumes.json unavailable, tier detection by position disabled', error);
    }
    return null;
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
