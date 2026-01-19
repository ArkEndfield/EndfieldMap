import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { TierDataInstance, TierDataManager } from '@endfieldmap/map-core/data/tier';
import { TierLayer } from '@endfieldmap/map-core/render/layers/tier';
import { TierOverlayMaskLayer } from '@endfieldmap/map-core/render/layers/tier_overlay_mask';
import type { GridTierItem, TierData } from '@endfieldmap/map-core/types/tier';
import { xyz2crd } from '@endfieldmap/tools';
import type { Projection } from 'ol/proj';

export interface TierControllerConfig {
  projection?: Projection;
  opacity?: number;
  maskOpacity?: number;
  maskFillColor?: string;
}

export class TierController {
  public tierDataManager: TierDataManager;
  public tierLayer: TierLayer;
  public tierOverlayMaskLayer: TierOverlayMaskLayer;

  constructor(config: TierControllerConfig = {}) {
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

  // _addTier(mapIndex: MapIndex, level: number, x: number, y: number, imageUrl: string): void {
  //   const [crdX, crdY] = xyz2crd({ x, y: 0, z: y }, mapIndex);

  //   const extent: [number, number, number, number] = [crdX, crdY, crdX, crdY];

  //   const tierData: TierData = {
  //     id: `${mapIndex}_${x}_${y}_${level}`,
  //     mapIndex,
  //     level,
  //     x,
  //     y,
  //     imageUrl,
  //     extent,
  //   };

  //   this.tierDataManager.addTier(tierData);
  // }

  public addTier(mapIndex: MapIndex, data: GridTierItem) {
    this.tierDataManager.addTier(mapIndex, data);
  }

  // async renderTier(mapIndex: MapIndex, x: number, y: number, level: number): Promise<void> {
  //   const tierId = `${mapIndex}_${x}_${y}_${level}`;
  //   const tier = this.tierDataManager['_tiers'].get(tierId);

  //   if (tier) {
  //     const img = new Image();
  //     await new Promise<void>((resolve, reject) => {
  //       img.onload = () => {
  //         const scaledWidth = img.width / 75;
  //         const scaledHeight = img.height / 75;
  //         const [crdX, crdY] = xyz2crd({ x, y: 0, z: y }, mapIndex);
  //         tier.extent = [crdX, crdY, crdX + scaledWidth, crdY + scaledHeight];
  //         resolve();
  //       };
  //       img.onerror = () => reject(new Error(`Failed to load image: ${tier.imageUrl}`));
  //       img.src = tier.imageUrl;
  //     });
  //   }

  //   await this.tierLayer.renderTier(mapIndex, x, y, level);
  //   this.tierOverlayMaskLayer.show();
  // }
  public async renderTier(mapIndex: MapIndex, id: string, subId?: string) {
    this.tierDataManager.clearActiveTier();

    this.tierDataManager.setActiveTier(mapIndex, id, subId);

    await this.tierLayer.renderTier();
    this.tierOverlayMaskLayer.show();
  }

  public async toggleTier(mapIndex: MapIndex, id: string, subId?: string) {
    if (subId) {
      if (this.tierDataManager.activeTier === id && this.tierDataManager.activeSubTier === subId) {
        this.clearTier();
      } else {
        await this.renderTier(mapIndex, id, subId);
      }
    } else {
      if (this.tierDataManager.activeTier === id) {
        this.clearTier();
      } else {
        await this.renderTier(mapIndex, id);
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
