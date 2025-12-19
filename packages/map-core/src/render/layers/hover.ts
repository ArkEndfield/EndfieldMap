import { LayerType, LayerTypeKey } from '@endfieldmap/map-core/const';
import { createHoverRingStyle } from '@endfieldmap/map-core/render/factory';
import { SingleLayerBase } from '@endfieldmap/map-core/render/layers/_base';
import { AnimatedRingFeature } from '@endfieldmap/map-core/render/renderer/animated_ring';
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

  /** 正在淡出的动画features */
  private fadingRings: Array<{ ring: AnimatedRingFeature; baseRadius: number }> = [];

  /** 动画帧ID */
  private animationFrameId: number | null = null;

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
    this.layer.set(LayerTypeKey, LayerType.HOVER_FEATURE);
  }

  /**
   * 显示hover效果
   * @param coordinate 坐标位置
   * @param circleRadius 底部圆的实际半径（包含描边）
   */
  public showHover(coordinate: Coordinate, circleRadius: number): void {
    // 如果有正在进行的动画，让它开始淡出而不是立即清除
    if (this.animatedRing) {
      if (!this.animatedRing.isFading()) {
        this.animatedRing.startFadeOut(performance.now());
      }
      // 将当前动画移到淡出列表（保存当前的baseRadius）
      this.fadingRings.push({
        ring: this.animatedRing,
        baseRadius: this.baseRadius,
      });
    }

    // 底部圆的基础半径 = 实际半径 - 描边宽度（3）
    this.baseRadius = circleRadius - 3;

    // 创建新的动画feature，传入底部圆的实际半径
    this.animatedRing = new AnimatedRingFeature(coordinate, circleRadius);
    this.source.addFeature(this.animatedRing.feature);

    // 确保动画循环正在运行
    if (this.animationFrameId === null) {
      this.animate();
    }
  }

  /**
   * 隐藏hover效果
   */
  public hideHover(): void {
    if (this.animatedRing) {
      if (!this.animatedRing.isFading()) {
        // 开始淡出动画，而不是立即清除
        this.animatedRing.startFadeOut(performance.now());
      }
      // 将当前动画移到淡出列表
      this.fadingRings.push({
        ring: this.animatedRing,
        baseRadius: this.baseRadius,
      });
      this.animatedRing = null;

      // 确保动画循环正在运行以完成淡出
      if (this.animationFrameId === null) {
        this.animate();
      }
    }
  }

  /**
   * 动画循环
   */
  private animate(): void {
    const timestamp = performance.now();
    let hasActiveAnimation = false;

    // 更新当前动画
    if (this.animatedRing) {
      const isComplete = this.animatedRing.update(timestamp);
      this.animatedRing.feature.changed();

      if (isComplete) {
        // 当前动画完成（淡出结束），清理
        this.source.removeFeature(this.animatedRing.feature);
        this.animatedRing = null;
      } else {
        hasActiveAnimation = true;
      }
    }

    // 更新所有淡出中的动画
    this.fadingRings = this.fadingRings.filter(({ ring }) => {
      const isComplete = ring.update(timestamp);
      ring.feature.changed();

      if (isComplete) {
        // 淡出完成，从source中移除
        this.source.removeFeature(ring.feature);
        return false;
      }
      hasActiveAnimation = true;
      return true;
    });

    // 如果还有活动的动画，继续下一帧
    if (hasActiveAnimation) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } else {
      this.animationFrameId = null;
    }
  }

  /**
   * 创建样式
   */
  private createStyle(feature: FeatureLike): Style[] {
    // 检查是否是当前动画
    if (this.animatedRing && feature === this.animatedRing.feature) {
      const currentRadius = this.animatedRing.getCurrentRadius();
      const opacity = this.animatedRing.getOpacity();
      const style = createHoverRingStyle(currentRadius, this.baseRadius, 2, `rgba(255, 255, 255, ${opacity * 0.6})`);
      return [style];
    }

    // 检查是否是淡出中的动画
    for (const { ring, baseRadius } of this.fadingRings) {
      if (feature === ring.feature) {
        const currentRadius = ring.getCurrentRadius();
        const opacity = ring.getOpacity();
        const style = createHoverRingStyle(currentRadius, baseRadius, 2, `rgba(255, 255, 255, ${opacity * 0.6})`);
        return [style];
      }
    }

    return [];
  }
}
