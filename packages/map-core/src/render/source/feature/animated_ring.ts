import { observable } from 'mobx';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import { Point } from 'ol/geom';

/**
 * 动画圆环Feature
 * 用于hover效果的动画圆环，从大到小收缩直到贴合图标边缘
 */
export class AnimatedRingFeature {
  /** OpenLayers Feature实例 */
  public feature: Feature<Point>;

  /** 目标半径（图标半径 + 2px） */
  private targetRadius: number;

  /** 起始半径（目标半径 * 1.5） */
  private startRadius: number;

  /** 结束半径（用于淡出动画，目标半径 * 1.5） */
  private endRadius: number;

  /** 当前半径 */
  @observable accessor currentRadius: number;

  /** 淡出开始时的半径 */
  private fadeOutStartRadius: number = 0;

  /** 动画进度 (0-1) */
  @observable accessor progress: number = 0;

  /** 透明度 (0-1) */
  @observable accessor opacity: number = 1;

  /** 动画持续时间（毫秒） */
  private duration: number = 500;

  /** 淡入动画持续时间（毫秒） */
  private fadeInDuration: number = 200;

  /** 淡出动画持续时间（毫秒） */
  private fadeOutDuration: number = 300;

  /** 动画开始时间 */
  private startTime: number;

  /** 是否正在淡出 */
  private isFadingOut: boolean = false;

  /** 淡出开始时间 */
  private fadeOutStartTime: number = 0;

  /** 淡出开始时的透明度 */
  private fadeOutStartOpacity: number = 1;

  constructor(coordinate: Coordinate, iconRadius: number) {
    // 计算目标半径和起始半径
    this.targetRadius = iconRadius + 4;
    this.startRadius = this.targetRadius * 1.2;
    this.endRadius = this.targetRadius * 1.2; // 淡出时扩散到的半径
    this.currentRadius = this.startRadius;

    // 初始透明度为0，用于淡入效果
    this.opacity = 0;

    // 创建OpenLayers Feature
    this.feature = new Feature({
      geometry: new Point(coordinate),
    });

    // 记录动画开始时间
    this.startTime = performance.now();
  }

  /**
   * 更新动画状态
   * @param timestamp 当前时间戳
   * @returns 是否动画完成（包括淡出）
   */
  public update(timestamp: number): boolean {
    if (this.isFadingOut) {
      // 淡出动画：向外扩散并淡出
      const fadeElapsed = timestamp - this.fadeOutStartTime;
      const fadeProgress = Math.min(fadeElapsed / this.fadeOutDuration, 1);

      // 使用ease-out缓动函数
      const easedProgress = this.easeOut(fadeProgress);

      // 透明度从淡出开始时的透明度线性减少到0
      this.opacity = this.fadeOutStartOpacity * (1 - fadeProgress);

      // 半径从当前半径扩大到结束半径
      this.currentRadius = this.fadeOutStartRadius + (this.endRadius - this.fadeOutStartRadius) * easedProgress;

      return fadeProgress >= 1;
    } else {
      // 收缩动画
      const elapsed = timestamp - this.startTime;
      this.progress = Math.min(elapsed / this.duration, 1);

      // 使用ease-out缓动函数
      const easedProgress = this.easeOut(this.progress);

      // 计算当前半径（从起始半径收缩到目标半径）
      this.currentRadius = this.startRadius - (this.startRadius - this.targetRadius) * easedProgress;

      // 淡入效果：在前fadeInDuration毫秒内，透明度从0增加到1
      const fadeInProgress = Math.min(elapsed / this.fadeInDuration, 1);
      this.opacity = fadeInProgress;

      return false; // 收缩动画不会自动结束，需要等待淡出
    }
  }

  /**
   * 开始淡出动画
   */
  public startFadeOut(timestamp: number): void {
    if (!this.isFadingOut) {
      this.isFadingOut = true;
      this.fadeOutStartTime = timestamp;
      this.fadeOutStartRadius = this.currentRadius; // 记录淡出开始时的半径
      this.fadeOutStartOpacity = this.opacity; // 记录淡出开始时的透明度
    }
  }

  /**
   * ease-out缓动函数
   * @param t 进度 (0-1)
   * @returns 缓动后的进度
   */
  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * 获取当前半径
   */
  public getCurrentRadius(): number {
    return this.currentRadius;
  }

  /**
   * 获取当前透明度
   */
  public getOpacity(): number {
    return this.opacity;
  }

  /**
   * 是否正在淡出
   */
  public isFading(): boolean {
    return this.isFadingOut;
  }
}
