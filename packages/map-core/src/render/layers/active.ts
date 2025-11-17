import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type Style from 'ol/style/Style';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import CircleStyle from 'ol/style/Circle';
import Stroke from 'ol/style/Stroke';
import OlStyle from 'ol/style/Style';

/**
 * Active图层
 * 用于显示active状态的蓝色圆环
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

  constructor() {
    super();

    // 创建source和layer
    this.source = new VectorSource();
    this.layer = new VectorLayer({
      source: this.source,
      style: this.createStyle.bind(this),
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      zIndex: 7, // 在hover层(8)之下，在entity层之上
    });

    // 设置图层类型标识
    this.layer.set('type', 'active');
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

  /**
   * 创建样式
   */
  private createStyle(_feature: FeatureLike): Style[] {
    if (!this.activeFeature) {
      return [];
    }

    // 圆环半径 = 底部圆半径 + 2px
    const ringRadius = this.circleRadius + 2;
    
    // displacement 应该与底部圆一致：baseRadius + 底部圆描边宽度(3) * 2
    const displacement = this.baseRadius + 3 * 2;

    const style = new OlStyle({
      image: new CircleStyle({
        radius: ringRadius,
        fill: undefined, // 无填充
        stroke: new Stroke({
          color: 'rgba(0, 123, 255, 0.8)', // 蓝色，80%不透明度
          width: 2,
        }),
        displacement: [0, displacement],
      }),
    });

    return [style];
  }
}
