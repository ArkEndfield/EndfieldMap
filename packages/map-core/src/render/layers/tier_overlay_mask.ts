import { DEFAULT_OPACITY, LayerType, LayerTypeKey } from '@endfieldmap/map-core/const/map';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { observable } from 'mobx';
import ImageLayer from 'ol/layer/Image';
import { ImageStatic } from 'ol/source';
import type ImageSource from 'ol/source/Image';

export interface TierOverlayMaskConfig {
  opacity?: number;
  fillColor?: string;
}

export class TierOverlayMaskLayer extends SingleLayerBase {
  public layer: ImageLayer<ImageSource>;
  @observable accessor config: TierOverlayMaskConfig;
  private maskCanvas: HTMLCanvasElement;

  constructor(config: TierOverlayMaskConfig = {}) {
    super();
    this.config = config;

    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = 1;
    this.maskCanvas.height = 1;
    const ctx = this.maskCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = config.fillColor ?? 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1, 1);
    }

    this.layer = new ImageLayer({
      opacity: config.opacity ?? DEFAULT_OPACITY,
      zIndex: -1.5,
    });

    this.layer.set(LayerTypeKey, LayerType.TIER_OVERLAY_MASK);
  }

  public show(): void {
    const extent = [-1000000, -1000000, 1000000, 1000000];

    const source = new ImageStatic({
      url: this.maskCanvas.toDataURL(),
      imageExtent: extent,
    });

    this.layer.setSource(source);
  }

  public hide(): void {
    this.layer.setSource(null);
  }

  public isVisible(): boolean {
    return this.layer.getSource() !== null;
  }

  public dispose() {
    this.layer.dispose();
  }
}
