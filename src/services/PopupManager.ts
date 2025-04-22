import { ref, Ref, watch } from 'vue';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import type { PointData } from '@/types/points';
import { xyz2crd } from '@/utils/common';
import { rafTimeout } from '@/utils/animationTimer';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { MarkerManager } from './markerManager';
import settings from '@/data/settings';

export class PopupManager {
  private map: Map;
  private overlay: Overlay;
  private popupContainer: HTMLElement;
  public isPopupVisible: Ref<boolean> = ref(false);
  private currentPosition: number[] | undefined;
  private entity: Ref<PointData | null>;
  public showVideoInfo: Ref<boolean> = ref(false);
  public openSubPopup: Ref<boolean> = ref(false);
  private isMapZooming = false; // 添加地图缩放状态标记
  public isMobileDevice: Ref<boolean> = ref(false); // 添加设备类型标记

  constructor(
    map: Map,
    overlay: Overlay,
    popupContainer: HTMLElement,
    entity: Ref<PointData | null>
  ) {
    this.map = map;
    this.overlay = overlay;
    this.popupContainer = popupContainer;
    this.entity = entity;

    // 初始检测设备类型
    this.initDeviceDetection();
  }

  // 初始化设备类型检测
  private initDeviceDetection() {
    if (typeof window !== 'undefined') {
      // 检测初始设备类型
      this.updateDeviceType();

      // 监听窗口大小变化
      window.addEventListener('resize', this.updateDeviceType.bind(this));
    }
  }

  // 更新设备类型
  private updateDeviceType() {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileWidth = window.innerWidth < 768;

    this.isMobileDevice.value = mobileRegex.test(userAgent) || isMobileWidth;
  }

  // 获取设备类型
  public getDeviceType(): boolean {
    return this.isMobileDevice.value;
  }

  // 关闭弹出层
  async closeToast() {
    this.isPopupVisible.value = false;
    await new Promise<void>(resolve => rafTimeout(resolve, 150));
  }

  async openToast() {
    this.isPopupVisible.value = true;
    this.repositionPopup();

    // 等待animation完成后再调整位置，防止与motion动画冲突
    // 增加等待时间，确保动画完全完成
    await new Promise<void>(resolve => rafTimeout(resolve, 200));

    // 再次检查弹窗是否仍然可见
    if (this.isPopupVisible.value) {
      // 使用 requestAnimationFrame 确保在下一帧调整位置
      requestAnimationFrame(() => {
        // 再次检查弹窗是否仍然可见
        if (this.isPopupVisible.value) {
          this.adjustPopupPosition();
        }
      });
    }
  }

  addVisibilityChangeListener(callback: (visible: boolean) => void) {
    return watch(this.isPopupVisible, callback);
  }

  // 切换视频信息显示状态
  toggleVideoInfo(show?: boolean) {
    // 如果提供了参数，直接设置为该值；否则切换状态
    this.showVideoInfo.value =
      show !== undefined ? show : !this.showVideoInfo.value;
    return this.showVideoInfo.value;
  }

  // 获取视频信息显示状态
  getVideoInfoStatus() {
    return this.showVideoInfo.value;
  }

  // 切换子弹窗显示状态
  toggleSubPopup() {
    // 如果提供了参数，直接设置为该值；否则切换状态
    this.openSubPopup.value = !this.openSubPopup.value;
    this.adjustPopupPosition();
    return this.openSubPopup.value;
  }

  // 打开副弹窗
  openSub() {
    this.openSubPopup.value = true;
    this.adjustPopupPosition();
  }

  // 关闭副弹窗
  closeSub() {
    this.openSubPopup.value = false;
    this.adjustPopupPosition();
  }

  // 获取子弹窗显示状态
  getSubPopupStatus() {
    return this.openSubPopup.value;
  }

  // 添加视频信息状态变化监听器
  addVideoInfoChangeListener(callback: (visible: boolean) => void) {
    return watch(this.showVideoInfo, callback);
  }

  // 添加子弹窗状态变化监听器
  addSubPopupChangeListener(callback: (visible: boolean) => void) {
    return watch(this.openSubPopup, callback);
  }

  // 弹出层出现动画
  async onEnterPopup(el: Element, onComplete: () => void) {
    try {
      // 移除可能存在的过渡样式
      el.removeAttribute('style');

      // 设置初始状态
      requestAnimationFrame(() => {
        el.setAttribute(
          'style',
          'display: block; opacity: 0; transform: scaleY(0); transition: none;'
        );

        // 确保初始状态被应用
        requestAnimationFrame(() => {
          // 添加过渡效果并设置最终状态
          el.setAttribute(
            'style',
            'display: block; opacity: 1; transform: scaleY(1); transition: opacity 0.2s ease, transform 0.2s ease;'
          );

          // 等待过渡完成
          rafTimeout(() => {
            el.removeAttribute('style');
            onComplete();
          }, 200);
        });
      });
    } catch (error) {
      console.error('Animation error:', error);
      onComplete();
    }
  }

  // 弹出层离开动画
  async onLeavePopup(el: Element, onComplete: () => void) {
    this.openSubPopup.value = false; // 关闭子弹窗

    try {
      // 移除可能存在的过渡样式
      el.removeAttribute('style');

      // 设置初始状态
      requestAnimationFrame(() => {
        el.setAttribute(
          'style',
          'display: block; opacity: 1; transform: scaleY(1); transition: none;'
        );

        // 确保初始状态被应用
        requestAnimationFrame(() => {
          // 添加过渡效果并设置最终状态
          el.setAttribute(
            'style',
            'display: block; opacity: 0; transform: scaleY(0); transition: opacity 0.2s ease, transform 0.2s ease;'
          );

          // 等待过渡完成
          rafTimeout(() => {
            el.removeAttribute('style');
            onComplete();
          }, 200);
        });
      });
    } catch (error) {
      console.error('Animation error:', error);
      onComplete();
    }
  }

  // 监听弹窗内容过渡动画结束
  onTransitionEnd(event: TransitionEvent) {
    if (
      event.propertyName === 'transform' &&
      event.target &&
      (event.target as HTMLElement).classList.contains('popup-slider') &&
      this.isPopupVisible.value
    ) {
      // 使用 requestAnimationFrame 确保在下一帧调整位置
      requestAnimationFrame(() => {
        // 再次检查弹窗是否仍然可见
        if (this.isPopupVisible.value) {
          console.log('过渡动画结束，调整弹窗位置');
          this.adjustPopupPosition();
        }
      });
    }
  }

  // 设置地图缩放状态
  setMapZooming(isZooming: boolean) {
    this.isMapZooming = isZooming;
  }

  // 获取地图缩放状态
  isZoomingMap() {
    return this.isMapZooming;
  }

  // 调整弹窗位置函数 - 添加防止缩放冲突的逻辑
  adjustPopupPosition() {
    if (
      !this.isPopupVisible.value ||
      !this.entity.value ||
      !settings.value.adjustPopupPosition
    )
      return;
    if (
      !this.currentPosition ||
      !this.popupContainer ||
      !this.map ||
      this.isMapZooming
    )
      return;

    // 使用 requestAnimationFrame 确保在下一帧获取位置，避免动画过程中的不准确位置
    requestAnimationFrame(() => {
      // 再次检查弹窗是否仍然可见
      if (!this.isPopupVisible.value) {
        console.log('弹窗已不可见，取消位置调整');
        return;
      }

      // 获取当前弹窗的实际尺寸
      const popupRect = this.popupContainer.getBoundingClientRect();
      const mapRect = this.map.getTargetElement().getBoundingClientRect();

      // 添加位置有效性检查
      if (popupRect.width === 0 || popupRect.height === 0) {
        console.warn('弹窗尺寸为0，可能是尚未完全渲染，延迟重试');
        // 如果弹窗尺寸为0，可能是尚未完全渲染，延迟重试
        setTimeout(() => this.adjustPopupPosition(), 50);
        return;
      }

      console.log('弹窗位置', popupRect);

      // 检查弹窗是否超出视口边界
      let needAdjust = false;
      let adjustX = 0;
      let adjustY = 0;

      // 安全边距
      const safeMargin = 30;
      const headerOffset = 50;

      // 根据设备类型和弹窗展开状态计算边界
      let extraRightMargin = 0;
      let extraTopMargin = 0;

      if (this.openSubPopup.value) {
        if (this.isMobileDevice.value) {
          // 移动设备上向上展开，增加顶部检查的边界
          extraTopMargin = 300; // 预估副弹窗高度
        } else {
          // 电脑上向右展开，增加右侧检查的边界
          extraRightMargin = 250; // 预估副弹窗宽度
        }
      }

      // 检查是否超出边界
      if (popupRect.left < mapRect.left + safeMargin) {
        needAdjust = true;
        adjustX = mapRect.left + safeMargin - popupRect.left;
      }

      if (popupRect.right + extraRightMargin > mapRect.right - safeMargin) {
        needAdjust = true;
        adjustX =
          mapRect.right - safeMargin - (popupRect.right + extraRightMargin);
      }

      if (
        popupRect.top - extraTopMargin <
        mapRect.top + safeMargin + headerOffset
      ) {
        // 添加顶部Header偏移量和展开的副弹窗高度
        needAdjust = true;
        adjustY =
          mapRect.top +
          safeMargin +
          headerOffset +
          extraTopMargin -
          popupRect.top;
      }

      if (popupRect.bottom > mapRect.bottom - safeMargin) {
        needAdjust = true;
        adjustY = mapRect.bottom - safeMargin - popupRect.bottom;
      }

      if (needAdjust) {
        const view = this.map.getView();
        const resolution = view.getResolution() || 1;
        const currentCenter = view.getCenter();
        if (!currentCenter) return;

        // 额外偏移以提供更多空间，但不要太多
        const extraOffset = 20; // 减少额外偏移
        const extraX =
          adjustX !== 0
            ? Math.sign(adjustX) *
              (extraOffset +
                (this.openSubPopup.value &&
                !this.isMobileDevice.value &&
                adjustX < 0
                  ? 40
                  : 0))
            : 0;

        // 为移动设备向上展开时提供额外的垂直空间
        const extraY =
          adjustY !== 0
            ? Math.sign(adjustY) *
              (extraOffset +
                (this.openSubPopup.value &&
                this.isMobileDevice.value &&
                adjustY > 0
                  ? 40
                  : 0))
            : 0;

        // 平滑动画
        view.animate({
          center: [
            currentCenter[0] - (adjustX + extraX) * resolution,
            currentCenter[1] + (adjustY + extraY) * resolution,
          ],
          duration: 250,
        });
      }
    });
  }
  // 更新当前位置
  setCurrentPosition(position: number[] | undefined) {
    this.currentPosition = position;
  }

  // 获取当前位置
  getCurrentPosition() {
    return this.currentPosition;
  }

  // 重新计算弹窗的位置，基于当前标点坐标和分辨率
  public repositionPopup() {
    if (!this.isPopupVisible.value || !this.entity.value) return;

    const currentMap = this.map;
    if (!currentMap) return;

    if (!this.entity.value.position) return;

    // 将实体原始位置转换为地图坐标
    const targetFeaturePosition = xyz2crd(this.entity.value.position);

    // 计算新位置，保持固定像素距离
    const newPosition = [targetFeaturePosition[0], targetFeaturePosition[1]];

    // 更新内部状态和弹窗位置
    this.currentPosition = [...targetFeaturePosition];
    this.overlay.setPosition(newPosition);
  }

  /**
   * 打开指定标记的弹窗
   * @param feature 标记
   * @returns Promise<void>
   */
  async openPopupForMarker(feature: Feature<Point>): Promise<void> {
    if (!this.map) return;

    const data = feature.get('payload');
    if (!data) return;

    // 设置 entity 和弹窗状态
    this.entity.value = data;
    const position = MarkerManager.getMarkerPosition(feature);
    if (!position) return;

    // 调整地图视图
    MarkerManager.moveToMarker(position);

    // 设置弹窗状态
    this.setCurrentPosition(position);
    this.toggleVideoInfo(false);

    // 选择标点
    const selectInteraction = this.map
      .getInteractions()
      .getArray()
      .find(i => i.get('name') === 'select') as any;
    if (selectInteraction) {
      selectInteraction.getFeatures().clear();
      selectInteraction.getFeatures().push(feature);
    }

    // 设置 overlay 位置
    const overlay = this.map.getOverlays().getArray()[0];
    if (overlay) {
      overlay.setPosition(position);
    }

    await new Promise(resolve => rafTimeout(resolve, 300));

    // 确保弹窗可见
    this.isPopupVisible.value = true;
    // 打开弹窗并等待动画完成
    await this.openToast();
  }
}
