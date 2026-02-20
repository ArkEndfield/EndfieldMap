import { TierLayer } from '@endfieldmap/map-adapter-ol/render/layers/tier';
import { TierOverlayMaskLayer } from '@endfieldmap/map-adapter-ol/render/layers/tier_overlay_mask';
import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import type { GridTierItem,MapData, MapDataManager } from '@endfieldmap/map-core';
import { TierDataManager } from '@endfieldmap/map-core';
import type { Coordinate } from 'ol/coordinate';

export interface TierControllerConfig {
  mapDataManager: MapDataManager;
  mapInstance: EndfieldMap;
  opacity?: number;
  maskFillColor?: string;
}

export class TierController {
  public tierDataManager: TierDataManager;
  public tierLayer: TierLayer;
  public tierOverlayMaskLayer: TierOverlayMaskLayer;
  private mapDataManager: MapDataManager;
  private mapInstance: EndfieldMap;

  constructor(config: TierControllerConfig) {
    this.mapDataManager = config.mapDataManager;
    this.mapInstance = config.mapInstance;
    this.tierDataManager = new TierDataManager(config.mapDataManager);
    this.tierLayer = new TierLayer(this.tierDataManager, config.mapDataManager);
    this.tierOverlayMaskLayer = new TierOverlayMaskLayer({
      opacity: 0.72, // TODO: 可配置
      fillColor: 'rgba(0, 0, 0, 1)', // TODO: 可配置
    });
  }

  public addTier(mapId: MapData['id'], data: GridTierItem) {
    this.tierDataManager.addTier(mapId, data);
  }

  public async renderTier(mapId: MapData['id'], center: Coordinate, id: string, subId?: string) {
    this.tierDataManager.clearActiveTier();

    this.tierDataManager.setActiveTier(mapId, id, subId);

    this.tierOverlayMaskLayer.show();
    await this.tierLayer.renderTier();
    this.mapInstance.view.animate({
      center: this.mapDataManager.xyz2crd({ x: center[0], y: 0, z: center[1] }, mapId),
      duration: 300,
    });
  }

  public async toggleTier(mapId: MapData['id'], center: Coordinate, id: string, subId?: string) {
    if (subId) {
      if (this.tierDataManager.activeTier === id && this.tierDataManager.activeSubTier === subId) {
        this.clearTier();
      } else {
        await this.renderTier(mapId, center, id, subId);
      }
    } else {
      if (this.tierDataManager.activeTier === id) {
        this.clearTier();
      } else {
        await this.renderTier(mapId, center, id);
      }
    }
  }

  public clearTier(): void {
    this.tierDataManager.clearActiveTier();
    this.tierLayer.clearTier();
    this.tierOverlayMaskLayer.hide();
  }

  dispose(): void {
    this.tierLayer.dispose();
    this.tierOverlayMaskLayer.dispose();
  }
}
