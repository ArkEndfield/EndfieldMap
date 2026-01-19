import { DEFAULT_OPACITY, LayerType, LayerTypeKey } from '@endfieldmap/map-core/const/map';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { TierDataInstance, TierDataManager } from '@endfieldmap/map-core/data/tier';
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

  constructor(config: TierLayerConfig) {
    super();
    this.config = config;
    this.layer = new ImageLayer({
      opacity: config.opacity ?? DEFAULT_OPACITY,
      zIndex: -1,
    });
    this.layer.set(LayerTypeKey, LayerType.TIER);
  }

  private loadImage(tier: TierDataInstance): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const imageUrl = tier.imageUrl;
      if (imageUrl === emptyImageBase64String) {
        resolve(emptyImage);
        return;
      }

      const scale = tier.mapIndex === 'map01' ? 75 / 2 : 75
      const img = ImagePool.getImage(imageUrl);
      if (img.isPool || img.image.complete || img.image.width > 0 || img.image.height > 0) {
        const scaledWidth = img.image.width / scale;
        const scaledHeight = img.image.height / scale;
        tier.setExtentExtra([scaledWidth, scaledHeight]);
        resolve(img.image);
      } else {
        img.image.src = imageUrl;
        img.image.onload = () => {
          const scaledWidth = img.image.width / scale;
          const scaledHeight = img.image.height / scale;
          tier.setExtentExtra([scaledWidth, scaledHeight]);
          resolve(img.image);
        };
        img.image.onerror = () => {
          console.warn(`[TierLayer] Image not available: ${imageUrl}`);
          resolve(null);
        };
      }
    });
  }

  public async renderTier(): Promise<void> {
    const tier = this.config.tierDataManager.currentActiveTier;

    if (!tier || !tier.visible) {
      this.layer.setSource(null);
      return;
    }

    const loadedImage = await this.loadImage(tier);

    if (this.config.tierDataManager.currentActiveTier !== tier) {
      return;
    }

    if (!loadedImage) {
      this.layer.setSource(null);
      return;
    }

    try {
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

  public clearTier(): void {
    this.layer.setSource(null);
  }
}
