import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { TierDataManager } from '@endfieldmap/map-core/data/tier';
import { TierLayer } from '@endfieldmap/map-core/render/layers/tier';
import { TierOverlayMaskLayer } from '@endfieldmap/map-core/render/layers/tier_overlay_mask';
import { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import type { MapData } from '@endfieldmap/map-core/types';
import type { GridTierItem } from '@endfieldmap/map-core/types/tier';
import type { Coordinate } from 'ol/coordinate';

export interface TierControllerConfig {
  opacity?: number;
  maskFillColor?: string;
}

export class TierController {
  public tierDataManager: TierDataManager;
  public tierLayer: TierLayer;
  public tierOverlayMaskLayer: TierOverlayMaskLayer;

  constructor() {
    this.tierDataManager = new TierDataManager();
    this.tierLayer = new TierLayer(this.tierDataManager);
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
    const mapInstance = EndfieldMap.getInstance();
    const mapDataManager = MapDataManager.getInstance();
    mapInstance.view.animate({
      center: mapDataManager.xyz2crd({ x: center[0], y: 0, z: center[1] }, mapId),
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
