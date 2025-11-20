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
import { LayerType, LayerTypeKey } from '@endfieldmap/map-core/const';

/**
 * 波纹动画状态
 */
interface RippleState {
  /** 开始时间 */
  startTime: number;
  /** 动画持续时间（毫秒） */
  duration: number;
}

const COLOR = '230,218,102';

/**
 * Active图层
 * 用于显示active状态的蓝色圆环和波纹动画
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

  /** 波纹动画状态数组 */
  private ripples: RippleState[] = [];

  /** 动画帧ID */
  private animationFrameId: number | null = null;

  /** 波纹间隔时间（毫秒） */
  private readonly rippleInterval: number = 800;

  /** 波纹动画持续时间（毫秒） */
  private readonly rippleDuration: number = 1600;

  /** 最后一次创建波纹的时间 */
  private lastRippleTime: number = 0;

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

    // 启动波纹动画
    this.startRippleAnimation();
  }

  /**
   * 隐藏active效果
   */
  public hideActive(): void {
    if (this.activeFeature) {
      this.source.clear();
      this.activeFeature = null;
    }

    // 停止波纹动画
    this.stopRippleAnimation();
  }

  /**
   * 启动波纹动画
   */
  private startRippleAnimation(): void {
    // 清除之前的动画
    this.stopRippleAnimation();

    // 重置波纹状态
    this.ripples = [];
    this.lastRippleTime = 0;

    // 启动动画循环
    const animate = () => {
      const now = Date.now();

      // 创建新波纹
      if (now - this.lastRippleTime >= this.rippleInterval) {
        this.ripples.push({
          startTime: now,
          duration: this.rippleDuration,
        });
        this.lastRippleTime = now;
      }

      // 移除已完成的波纹
      this.ripples = this.ripples.filter((ripple) => now - ripple.startTime < ripple.duration);

      // 触发重绘
      this.layer.changed();

      // 继续动画
      if (this.activeFeature) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * 停止波纹动画
   */
  private stopRippleAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.ripples = [];
  }

  /**
   * 创建样式
   */
  private createStyle(_feature: FeatureLike): Style[] {
    if (!this.activeFeature) {
      return [];
    }

    const styles: Style[] = [];

    // 圆环半径 = 底部圆半径 + 2px
    const ringRadius = this.circleRadius + 2;
    
    // displacement 应该与底部圆一致：baseRadius + 底部圆描边宽度(3) * 2
    const displacement = this.baseRadius + 3 * 2;

    // 主圆环样式（静态）
    const mainStyle = new OlStyle({
      image: new CircleStyle({
        radius: ringRadius,
        fill: undefined, // 无填充
        stroke: new Stroke({
          color: `rgba(${COLOR}, 0.8)`,
          width: 3,
        }),
        displacement: [0, displacement],
      }),
    });
    styles.push(mainStyle);

    // 波纹样式（动画）
    const now = Date.now();
    this.ripples.forEach((ripple) => {
      const elapsed = now - ripple.startTime;
      const progress = elapsed / ripple.duration; // 0 到 1

      // 计算波纹半径：从主圆环半径扩散到更小的范围
      const rippleRadius = ringRadius + (ringRadius * 0.6 * progress);

      // 计算透明度：从 0.6 淡出到 0
      const opacity = 0.6 * (1 - progress);

      const rippleStyle = new OlStyle({
        image: new CircleStyle({
          radius: rippleRadius,
          fill: undefined,
          stroke: new Stroke({
            color: `rgba(${COLOR}, ${opacity})`,
            width: 2,
          }),
          displacement: [0, displacement],
        }),
      });
      styles.push(rippleStyle);
    });

    return styles;
  }
}
