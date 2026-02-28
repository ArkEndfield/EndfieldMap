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
 * 支持从一个实体切换到另一个时的平滑位移动画，以及淡出消失动画
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

  /** 动画帧ID（位移和淡出共用） */
  private animFrameId: number | null = null;

  /** 位移动画状态 */
  private moveStartCoord: Coordinate | null = null;
  private moveEndCoord: Coordinate | null = null;
  private moveStartTime: number = 0;
  private readonly moveDuration: number = 300;

  /** 淡出动画状态 */
  private isFadingOut: boolean = false;
  private fadeStartTime: number = 0;
  private fadeOpacity: number = 1;
  private fadeRadiusExpand: number = 0;
  private readonly fadeDuration: number = 100;

  constructor() {
    super();

    this.source = new VectorSource();
    this.layer = new VectorLayer({
      source: this.source,
      style: this.createStyle.bind(this),
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      zIndex: Z_INDEX.ACTIVE,
    });

    this.layer.set(LayerTypeKey, LayerType.ACTIVE_FEATURE);
  }

  /**
   * 显示active效果
   * 如果当前已有 active feature（包括正在淡出的），会以动画过渡到新位置
   * @param coordinate 坐标位置
   * @param circleRadius 底部圆的实际半径（包含描边）
   */
  public showActive(coordinate: Coordinate, circleRadius: number): void {
    this.circleRadius = circleRadius;
    this.baseRadius = circleRadius - 3;

    if (this.activeFeature) {
      if (this.isFadingOut) {
        this.isFadingOut = false;
        this.fadeOpacity = 1;
        this.fadeRadiusExpand = 0;
      }

      const currentCoord = this.isMoving()
        ? this.getInterpolatedCoord()
        : this.activeFeature.getGeometry()!.getCoordinates();

      this.moveStartCoord = currentCoord;
      this.moveEndCoord = coordinate;
      this.moveStartTime = performance.now();

      this.ensureAnimationLoop();
      return;
    }

    this.activeFeature = new Feature({
      geometry: new Point(coordinate),
    });
    this.source.addFeature(this.activeFeature);
    this.layer.changed();
  }

  /**
   * 隐藏active效果（带淡出动画）
   */
  public hideActive(): void {
    if (!this.activeFeature) return;

    if (this.isMoving() && this.moveEndCoord) {
      this.activeFeature.getGeometry()!.setCoordinates(this.moveEndCoord);
    }
    this.clearMoveState();

    this.isFadingOut = true;
    this.fadeStartTime = performance.now();
    this.fadeOpacity = 1;
    this.fadeRadiusExpand = 0;

    this.ensureAnimationLoop();
  }

  // #region 动画

  private animationLoop(): void {
    if (!this.activeFeature) {
      this.animFrameId = null;
      return;
    }

    const now = performance.now();
    let active = false;

    if (this.moveStartCoord && this.moveEndCoord) {
      const progress = Math.min((now - this.moveStartTime) / this.moveDuration, 1);
      const eased = this.easeOutCubic(progress);

      const x = this.moveStartCoord[0] + (this.moveEndCoord[0] - this.moveStartCoord[0]) * eased;
      const y = this.moveStartCoord[1] + (this.moveEndCoord[1] - this.moveStartCoord[1]) * eased;

      this.activeFeature.getGeometry()!.setCoordinates([x, y]);

      if (progress < 1) {
        active = true;
      } else {
        this.clearMoveState();
      }
    }

    if (this.isFadingOut) {
      const progress = Math.min((now - this.fadeStartTime) / this.fadeDuration, 1);
      const eased = this.easeOutCubic(progress);

      this.fadeOpacity = 1 - progress;
      this.fadeRadiusExpand = eased * 6;

      if (progress < 1) {
        active = true;
      } else {
        this.isFadingOut = false;
        this.fadeOpacity = 1;
        this.fadeRadiusExpand = 0;
        this.source.clear();
        this.activeFeature = null;
        this.animFrameId = null;
        return;
      }
    }

    this.activeFeature?.changed();

    if (active) {
      this.animFrameId = requestAnimationFrame(() => this.animationLoop());
    } else {
      this.animFrameId = null;
    }
  }

  private ensureAnimationLoop(): void {
    if (this.animFrameId === null) {
      this.animFrameId = requestAnimationFrame(() => this.animationLoop());
    }
  }

  private isMoving(): boolean {
    return this.moveStartCoord !== null && this.moveEndCoord !== null;
  }

  private getInterpolatedCoord(): Coordinate {
    if (!this.moveStartCoord || !this.moveEndCoord) {
      return this.activeFeature!.getGeometry()!.getCoordinates();
    }
    const progress = Math.min((performance.now() - this.moveStartTime) / this.moveDuration, 1);
    const eased = this.easeOutCubic(progress);
    return [
      this.moveStartCoord[0] + (this.moveEndCoord[0] - this.moveStartCoord[0]) * eased,
      this.moveStartCoord[1] + (this.moveEndCoord[1] - this.moveStartCoord[1]) * eased,
    ];
  }

  private clearMoveState(): void {
    this.moveStartCoord = null;
    this.moveEndCoord = null;
  }

  private cancelAllAnimations(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.clearMoveState();
    this.isFadingOut = false;
    this.fadeOpacity = 1;
    this.fadeRadiusExpand = 0;
  }

  /**
   * 销毁active图层，取消动画
   */
  public dispose(): void {
    this.cancelAllAnimations();
    this.source.clear();
    this.activeFeature = null;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  // #endregion

  private createStyle(_feature: FeatureLike): Style[] {
    if (!this.activeFeature) {
      return [];
    }

    const opacity = this.fadeOpacity;
    const radius = this.circleRadius + 8 + this.fadeRadiusExpand;

    return [
      createHoverCornerStyle(
        radius,
        this.baseRadius,
        3,
        `rgba(245, 222, 25, ${0.95 * opacity})`,
        10,
        { blur: 12 * opacity, color: `rgba(245, 222, 25, ${0.6 * opacity})` },
      ),
    ];
  }
}
