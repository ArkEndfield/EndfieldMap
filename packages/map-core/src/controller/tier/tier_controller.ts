import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { TierDataInstance, TierDataManager } from '@endfieldmap/map-core/data/tier';
import { TierLayer } from '@endfieldmap/map-core/render/layers/tier';
import { TierOverlayMaskLayer } from '@endfieldmap/map-core/render/layers/tier_overlay_mask';
import type { GridTierItem, TierData } from '@endfieldmap/map-core/types/tier';
import { Coordinate, xyz2crd } from '@endfieldmap/tools';
import { Map } from 'ol';
import type { Projection } from 'ol/proj';

export interface TierControllerConfig {
  projection?: Projection;
  opacity?: number;
  maskOpacity?: number;
  maskFillColor?: string;
  map: Map;
}

export class TierController {
  public tierDataManager: TierDataManager;
  public tierLayer: TierLayer;
  public tierOverlayMaskLayer: TierOverlayMaskLayer;
  /** 地图实例 */
  private map: Map;

  constructor(config: TierControllerConfig) {
    this.map = config.map;
    this.tierDataManager = new TierDataManager();
    this.tierLayer = new TierLayer({
      tierDataManager: this.tierDataManager,
      projection: config.projection,
      opacity: config.opacity,
    });
    this.tierOverlayMaskLayer = new TierOverlayMaskLayer({
      opacity: config.maskOpacity ?? 0.72,
      fillColor: config.maskFillColor ?? 'rgba(0, 0, 0, 1)',
    });
  }

  public async renderTier(mapIndex: MapIndex, center: Coordinate, id: string, subId?: string) {
    this.tierDataManager.clearActiveTier();

    this.tierDataManager.setActiveTier(mapIndex, id, subId);

    this.tierOverlayMaskLayer.show();
    await this.tierLayer.renderTier();
    this.map.getView().animate({
      center: xyz2crd({ x: center[0], y: 0, z: center[1] }, mapIndex),
      duration: 300,
    });
  }

  public async toggleTier(mapIndex: MapIndex, center: Coordinate, id: string, subId?: string) {
    if (subId) {
      if (this.tierDataManager.activeTier === id && this.tierDataManager.activeSubTier === subId) {
        this.clearTier();
      } else {
        await this.renderTier(mapIndex, center, id, subId);
      }
    } else {
      if (this.tierDataManager.activeTier === id) {
        this.clearTier();
      } else {
        await this.renderTier(mapIndex, center, id);
      }
    }
  }

  clearTier(): void {
    this.tierDataManager.clearActiveTier();
    this.tierLayer.clearTier();
    this.tierOverlayMaskLayer.hide();
  }

  dispose(): void {
    this.tierLayer.dispose();
    this.tierOverlayMaskLayer.dispose();
  }
}
