import { createHoverRingStyle } from '@endfieldmap/map-core/render/factory';
import { AnimatedRingFeature } from '@endfieldmap/map-core/render/source/feature/animated_ring';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type Style from 'ol/style/Style';

/**
 * Hover图层
 * 用于显示hover效果的半透明圆环动画
 */
export class HoverLayer extends SingleLayerBase {
  /** 图层实例 */
  public layer: VectorLayer<VectorSource>;

  /** hover feature source */
  private source: VectorSource;

  /** 当前的动画feature */
  private animatedRing: AnimatedRingFeature | null = null;

  /** 动画帧ID */
  private animationFrameId: number | null = null;

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
      zIndex: 8, // 最高层级，确保hover效果在所有图层之上
    });
    
    // 设置图层类型标识，用于在hit test中排除此图层
    this.layer.set('type', 'hover');
  }

  /**
   * 显示hover效果
   * @param coordinate 坐标位置
   * @param circleRadius 底部圆的实际半径（包含描边）
   */
  public showHover(coordinate: Coordinate, circleRadius: number): void {
    // 如果有正在进行的动画，立即清除
    if (this.animatedRing) {
      this.stopAnimation();
      this.source.clear();
      this.animatedRing = null;
    }

    // 保存半径信息
    this.circleRadius = circleRadius;
    // 底部圆的基础半径 = 实际半径 - 描边宽度（3）
    this.baseRadius = circleRadius - 3;

    // 创建新的动画feature，传入底部圆的实际半径
    this.animatedRing = new AnimatedRingFeature(coordinate, circleRadius);
    this.source.addFeature(this.animatedRing.feature);

    // 开始动画
    this.animate();
  }

  /**
   * 隐藏hover效果
   */
  public hideHover(): void {
    if (this.animatedRing && !this.animatedRing.isFading()) {
      // 开始淡出动画，而不是立即清除
      this.animatedRing.startFadeOut(performance.now());
      // 继续动画循环以完成淡出
      if (this.animationFrameId === null) {
        this.animate();
      }
    }
  }

  /**
   * 动画循环
   */
  private animate(): void {
    if (!this.animatedRing) {
      return;
    }

    const timestamp = performance.now();
    const isComplete = this.animatedRing.update(timestamp);

    // 触发重新渲染
    this.animatedRing.feature.changed();

    // 如果动画完成（淡出结束），清理资源
    if (isComplete) {
      this.source.clear();
      this.animatedRing = null;
      this.animationFrameId = null;
    } else {
      // 继续下一帧
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * 停止动画
   */
  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 创建样式
   */
  private createStyle(_feature: FeatureLike): Style[] {
    if (!this.animatedRing) {
      return [];
    }

    const currentRadius = this.animatedRing.getCurrentRadius();
    const opacity = this.animatedRing.getOpacity();
    // 使用 baseRadius 来计算 displacement，确保与底部圆对齐
    const style = createHoverRingStyle(currentRadius, this.baseRadius, 2, `rgba(255, 255, 255, ${opacity * 0.6})`);

    return [style];
  }
}
