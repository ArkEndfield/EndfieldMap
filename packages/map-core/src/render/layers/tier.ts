import type { MapIndex } from '@endfieldmap/map-core/const/map';
import { DEFAULT_OPACITY, LayerType, LayerTypeKey } from '@endfieldmap/map-core/const/map';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { TierDataManager } from '@endfieldmap/map-core/data/tier';
import { ImagePool } from '@endfieldmap/tools';
import { observable } from 'mobx';
import ImageLayer from 'ol/layer/Image';
import type { Projection } from 'ol/proj';
import { ImageStatic } from 'ol/source';

const emptyImageBase64String = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const emptyImage = new Image();
emptyImage.src = emptyImageBase64String;

export interface TierLayerConfig {
  opacity?: number;
  projection?: Projection;
  tierDataManager: TierDataManager;
}

export class TierLayer extends SingleLayerBase {
  public layer: ImageLayer<ImageStatic>;
  @observable accessor config: TierLayerConfig;
  private currentMapIndex: MapIndex | null = null;
  private currentRegion: { x: number; y: number } | null = null;
  private currentLevel: number | null = null;

  constructor(config: TierLayerConfig) {
    super();
    this.config = config;
    this.layer = new ImageLayer({
      opacity: config.opacity ?? DEFAULT_OPACITY,
      zIndex: -1,
    });
    this.layer.set(LayerTypeKey, LayerType.TIER);
  }

  private loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (imageUrl === emptyImageBase64String) {
        resolve(emptyImage);
        return;
      }

      const img = ImagePool.getImage(imageUrl);
      if (img.isPool || img.image.complete || img.image.width > 0 || img.image.height > 0) {
        resolve(img.image);
      } else {
        img.image.src = imageUrl;
        img.image.onload = () => {
          resolve(img.image);
        };
        img.image.onerror = () => {
          reject(new Error(`Failed to load image: ${imageUrl}`));
        };
      }
    });
  }

  public async renderTier(mapIndex: MapIndex, x: number, y: number, level: number): Promise<void> {
    this.currentMapIndex = mapIndex;
    this.currentRegion = { x, y };
    this.currentLevel = level;

    const activeTier = this.config.tierDataManager.getActiveTier(mapIndex, x, y);

    if (!activeTier || activeTier.level !== level) {
      this.config.tierDataManager.setActiveTier(mapIndex, x, y, level);
    }

    const tier = this.config.tierDataManager.getActiveTier(mapIndex, x, y);

    if (!tier || !tier.visible) {
      this.layer.setSource(null);
      return;
    }

    try {
      await this.loadImage(tier.imageUrl);
      const source = new ImageStatic({
        url: tier.imageUrl,
        projection: this.config.projection,
        imageExtent: tier.extent,
      });

      this.layer.setSource(source);
    } catch (error) {
      console.error('Failed to render tier:', error);
      this.layer.setSource(null);
    }
  }

  public clearTier(mapIndex: MapIndex, x: number, y: number): void {
    this.config.tierDataManager.clearActiveTier(mapIndex, x, y);
    this.layer.setSource(null);
    this.currentMapIndex = null;
    this.currentRegion = null;
    this.currentLevel = null;
  }

  public getCurrentTierInfo(): {
    mapIndex: MapIndex | null;
    region: { x: number; y: number } | null;
    level: number | null;
  } {
    return {
      mapIndex: this.currentMapIndex,
      region: this.currentRegion,
      level: this.currentLevel,
    };
  }
}
