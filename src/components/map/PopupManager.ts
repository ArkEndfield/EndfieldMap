import { ref, Ref, watch } from 'vue';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { PointData } from '@/data/points';
import { xyz2crd } from '@/utils/common';
import { shouldShowRewards } from '@/data/reward';
import { rafTimeout } from '@/utils/animationTimer';

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
    await new Promise<void>(resolve => rafTimeout(resolve, 150));

    if (this.isPopupVisible.value) {
      this.adjustPopupPosition();
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
      this.adjustPopupPosition();
    }
  }

  // 处理弹出层的关闭和重新打开
  async closeAndReopenPopup(data: PointData, newPosition: number[]) {
    // 保存新数据，以便在动画完成后使用
    const newData = data;
    const popupPosition = [...newPosition];
    const wasExpanded = this.openSubPopup.value; // 记录当前弹窗是否展开

    try {
      console.log('开始关闭和重新打开弹窗');
      // 1. 先关闭副弹窗
      this.openSubPopup.value = false;

      // 2. 开始关闭当前弹窗
      await this.closeToast();

      // 3. 更新数据和位置
      this.entity.value = newData;
      this.showVideoInfo.value = false;
      this.currentPosition = popupPosition;
      this.overlay.setPosition(popupPosition);
      // 4. 展开新弹窗
      await this.openToast();

      // 5. 如果之前是展开状态，检查新标点是否有奖励，只有有奖励时才展开副弹窗
      if (wasExpanded) {
        const hasRewards = shouldShowRewards(newData);

        if (hasRewards) {
          this.openSubPopup.value = true;
          await new Promise<void>(resolve => rafTimeout(resolve, 300));
          // 展开后再次检查位置
          this.adjustPopupPosition();
        }
      }
    } catch (error) {
      console.error('Popup transition error:', error);
      this.openSubPopup.value = false;
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
      !this.currentPosition ||
      !this.popupContainer ||
      !this.map ||
      this.isMapZooming
    )
      return;
    // 获取当前弹窗的实际尺寸
    const popupRect = this.popupContainer.getBoundingClientRect();
    const mapRect = this.map.getTargetElement().getBoundingClientRect();

    // 检查弹窗是否超出视口边界
    let needAdjust = false;
    let adjustX = 0;
    let adjustY = 0;

    // 安全边距
    const safeMargin = 30;
    const headerOffset = 50;

    // 如果子弹窗展开，增加右侧检查的边界
    const extraRightMargin = this.openSubPopup.value ? 320 : 0; // 调整副弹窗宽度估计
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

    if (popupRect.top < mapRect.top + safeMargin + headerOffset) {
      // 添加顶部Header偏移量
      needAdjust = true;
      adjustY = mapRect.top + safeMargin + headerOffset - popupRect.top;
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
            (extraOffset + (this.openSubPopup.value && adjustX < 0 ? 40 : 0))
          : 0;
      const extraY = adjustY !== 0 ? Math.sign(adjustY) * extraOffset : 0;

      // 平滑动画
      view.animate({
        center: [
          currentCenter[0] - (adjustX + extraX) * resolution,
          currentCenter[1] + (adjustY + extraY) * resolution,
        ],
        duration: 250,
      });
    }
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

    // 注意：我们需要从实体的原始位置计算，而不是使用可能已经修改过的currentPosition
    if (!this.entity.value.position) return;

    // 将实体原始位置转换为地图坐标
    const targetFeaturePosition = xyz2crd(this.entity.value.position);

    // 获取当前地图分辨率
    const resolution = currentMap.getView().getResolution() || 1;

    // 计算固定像素偏移量对应的地图单位
    const yOffset = 20 * resolution;

    // 计算新位置，保持固定像素距离
    const newPosition = [
      targetFeaturePosition[0],
      targetFeaturePosition[1] + yOffset,
    ];

    // 更新内部状态和弹窗位置
    this.currentPosition = [...targetFeaturePosition]; // 更新基础位置（不含偏移）
    this.overlay.setPosition(newPosition); // 设置带偏移的实际位置
  }
}
