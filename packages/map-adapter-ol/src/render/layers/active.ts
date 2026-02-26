import { createHoverCornerStyle } from '@endfieldmap/map-adapter-ol/render/factory';
import { SingleLayerBase } from '@endfieldmap/map-adapter-ol/render/layers/_base';
import { LayerType, LayerTypeKey } from '@endfieldmap/map-core';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type Style from 'ol/style/Style';

import { Z_INDEX } from '@endfieldmap/map-adapter-ol/render/zIndex';

/**
 * Active图层
 * 用于显示active状态的四角标点
 */
export class ActiveLayer extends SingleLayerBase {
  /** 图层实例 */
  public layer: VectorLayer<VectorSource>;

  /** active feature source */
  private source: VectorSource;

  /** 当前的active feature */
  private activeFeature: Feature<Point> | null = null;

  /** 底部圆的实际半径（包含描边，用于计算目标半径） */
  private circleRadius: number = 12;

  /** 底部圆的基础半径（不含描边，用于计算displacement） */
  private baseRadius: number = 12;

  private readonly activeColor: string = 'rgba(245, 222, 25, 0.95)';

  constructor() {
    super();

    // 创建source和layer
    this.source = new VectorSource();
    this.layer = new VectorLayer({
      source: this.source,
      style: this.createStyle.bind(this),
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      zIndex: Z_INDEX.ACTIVE,
    });

    // 设置图层类型标识
    this.layer.set(LayerTypeKey, LayerType.ACTIVE_FEATURE);
  }

  /**
   * 显示active效果
   * @param coordinate 坐标位置
   * @param circleRadius 底部圆的实际半径（包含描边）
   */
  public showActive(coordinate: Coordinate, circleRadius: number): void {
    // 如果已有active feature，先清除
    if (this.activeFeature) {
      this.source.clear();
      this.activeFeature = null;
    }

    // 保存半径信息
    this.circleRadius = circleRadius;
    // 底部圆的基础半径 = 实际半径 - 描边宽度（3）
    this.baseRadius = circleRadius - 3;

    // 创建新的feature
    this.activeFeature = new Feature({
      geometry: new Point(coordinate),
    });
    this.source.addFeature(this.activeFeature);

    this.layer.changed();
  }

  /**
   * 隐藏active效果
   */
  public hideActive(): void {
    if (this.activeFeature) {
      this.source.clear();
      this.activeFeature = null;
    }
  }

  private createStyle(_feature: FeatureLike): Style[] {
    if (!this.activeFeature) {
      return [];
    }

    const radius = this.circleRadius + 4; // 稍微比底部圆大一点

    return [
      createHoverCornerStyle(
        radius,
        this.baseRadius,
        3, // 描边稍宽一点
        this.activeColor
      ),
    ];
  }
}
