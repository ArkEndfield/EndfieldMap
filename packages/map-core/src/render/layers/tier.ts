import { LayerType, LayerTypeKey } from '@endfieldmap/map-core/const/map';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { TierDataInstance, TierDataManager } from '@endfieldmap/map-core/data/tier';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import { emptyImage, emptyImageBase64String } from '@endfieldmap/map-core/utils/image';
import { ImagePool, logger } from '@endfieldmap/tools';
import ImageLayer from 'ol/layer/Image';
import { ImageStatic } from 'ol/source';

export interface TierLayerConfig {
  tierDataManager: TierDataManager;
  mapDataManager: MapDataManager;
}

export class TierLayer extends SingleLayerBase {
  public layer: ImageLayer<ImageStatic>;
  private tierDataManager: TierDataManager;
  private mapDataManager: MapDataManager;

  constructor(tierDataManager: TierDataManager, mapDataManager: MapDataManager) {
    super();
    this.tierDataManager = tierDataManager;
    this.mapDataManager = mapDataManager;
    this.layer = new ImageLayer({
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

      // TODO: 不知道可不可能有什么潜在问题
      const mapData = this.mapDataManager.getMapData(tier.mapId);
      if (!mapData) {
        logger.error('[EndfieldMap | tier] mapData not found', tier);
        resolve(null);
        return;
      }
      // const scale = tier.mapId === 'map02' ? 75 : 75 / 2;
      const scale = 75 / (16 / mapData.scale);
      const img = ImagePool.getImage(imageUrl);
      if (img.isPool || img.image.complete || img.image.naturalWidth > 0 || img.image.naturalHeight > 0) {
        const scaledWidth = img.image.naturalWidth / scale;
        const scaledHeight = img.image.naturalHeight / scale;
        tier.setExtentExtra([scaledWidth, scaledHeight]);
        resolve(img.image);
      } else {
        img.image.src = imageUrl;
        img.image.onload = () => {
          const scaledWidth = img.image.naturalWidth / scale;
          const scaledHeight = img.image.naturalHeight / scale;
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
    const tier = this.tierDataManager.currentActiveTier;

    if (!tier || !tier.visible) {
      this.clearTier();
      return;
    }

    const loadedImage = await this.loadImage(tier);

    if (this.tierDataManager.currentActiveTier !== tier) {
      return;
    }

    if (!loadedImage) {
      logger.error('[EndfieldMap | tier] 加载图片失败', tier);
      return;
    }

    try {
      const source = new ImageStatic({
        url: tier.imageUrl,
        projection: EndfieldMap.projection,
        imageExtent: tier.extent,
      });

      this.layer.setSource(source);
    } catch (error) {
      console.error('Failed to render tier:', error);
    }
  }

  public clearTier(): void {
    this.layer.setSource(null);
  }

  public dispose() {
    this.layer.dispose();
  }
}
