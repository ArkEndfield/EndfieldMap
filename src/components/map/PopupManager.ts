import { Ref } from 'vue';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { PointData } from '@/data/points';

export class PopupManager {
  private map: Map;
  private overlay: Overlay;
  private popupContainer: HTMLElement;
  private isPopupVisible: Ref<boolean>;
  private currentPosition: number[] | undefined;
  private isPopupAnimating = false;
  private entity: Ref<PointData>;
  private showVideoInfo: Ref<boolean>;
  private openSubPopup: Ref<boolean>;
  private isMapZooming = false; // 添加地图缩放状态标记

  constructor(
    map: Map,
    overlay: Overlay,
    popupContainer: HTMLElement,
    isPopupVisible: Ref<boolean>,
    entity: Ref<PointData>,
    showVideoInfo: Ref<boolean>,
    openSubPopup: Ref<boolean>
  ) {
    this.map = map;
    this.overlay = overlay;
    this.popupContainer = popupContainer;
    this.isPopupVisible = isPopupVisible;
    this.entity = entity;
    this.showVideoInfo = showVideoInfo;
    this.openSubPopup = openSubPopup;
  }

  // 关闭弹出层
  closeToast() {
    // 修改为仅设置isPopupVisible为false，让Vue的过渡系统处理关闭动画
    this.isPopupVisible.value = false;

    // 其他清理工作会在弹窗动画完成后由上层组件处理
    // 在弹窗完全消失前不要清除position，否则会影响动画
  }

  // 切换视频信息显示状态
  toggleVideoInfo(show: boolean) {
    this.showVideoInfo.value = show;
    // 切换内容后不立即调整位置，让过渡动画完成后再调整
  }

  // 切换子弹窗显示状态
  toggleSubPopup() {
    this.openSubPopup.value = !this.openSubPopup.value;

    // 在状态改变后等待过渡动画完成，然后调整位置
    // 增加延迟时间以确保DOM更新完成
    setTimeout(() => {
      if (this.isPopupVisible.value && this.currentPosition) {
        // 调整地图以适应展开的弹窗
        this.adjustForExpandedPopup(this.openSubPopup.value);
      }
    }, 100); // 先快速响应

    // 再次检查位置，确保完整展示
    setTimeout(() => {
      if (this.isPopupVisible.value && this.currentPosition) {
        this.adjustPopupPosition(true);
      }
    }, 550); // 动画完成后再次调整
  }

  // 弹出层出现动画
  async onEnterPopup(el: Element, onComplete: () => void) {
    this.isPopupAnimating = true;

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
          setTimeout(() => {
            el.removeAttribute('style');
            this.isPopupAnimating = false;
            onComplete();
          }, 200);
        });
      });
    } catch (error) {
      console.error('Animation error:', error);
      this.isPopupAnimating = false;
      onComplete();
    }
  }

  // 弹出层离开动画
  async onLeavePopup(el: Element, onComplete: () => void) {
    this.openSubPopup.value = false; // 关闭子弹窗
    this.isPopupAnimating = true;

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
          setTimeout(() => {
            el.removeAttribute('style');
            this.isPopupAnimating = false;
            onComplete();
          }, 200);
        });
      });
    } catch (error) {
      console.error('Animation error:', error);
      this.isPopupAnimating = false;
      onComplete();
    }
  }

  // 监听弹窗内容过渡动画结束
  onTransitionEnd(event: TransitionEvent) {
    if (
      event.propertyName === 'transform' &&
      event.target &&
      (event.target as HTMLElement).classList.contains('popup-slider') &&
      this.isPopupVisible.value &&
      !this.isPopupAnimating
    ) {
      this.adjustPopupPosition(true);
    }
  }

  // 处理弹出层的关闭和重新打开
  async closeAndReopenPopup(data: PointData, newPosition: number[]) {
    if (this.isPopupAnimating) {
      return; // 如果动画正在进行中，不执行新的切换
    }

    // 保存新数据，以便在动画完成后使用
    const newData = data;
    const popupPosition = [...newPosition];
    const wasExpanded = this.openSubPopup.value; // 记录当前弹窗是否展开

    // 标记动画状态
    this.isPopupAnimating = true;

    try {
      // 1. 先关闭副弹窗
      this.openSubPopup.value = false;

      // 2. 开始关闭当前弹窗
      this.isPopupVisible.value = false;

      // 3. 等待关闭动画完成
      await new Promise(resolve => setTimeout(resolve, 250));

      // 4. 更新数据和位置
      this.entity.value = newData;
      this.showVideoInfo.value = false;
      this.currentPosition = popupPosition;
      this.overlay.setPosition(popupPosition);

      // 5. 展开新弹窗
      this.isPopupVisible.value = true;

      // 6. 等待弹窗完全展开
      await new Promise(resolve => setTimeout(resolve, 200));

      // 7. 调整视图位置
      await this.adjustMapForPopup(this.map, popupPosition, true);

      // 8. 如果之前是展开状态，等待视图调整完成后再展开副弹窗
      if (wasExpanded) {
        setTimeout(() => {
          this.openSubPopup.value = true;
          // 展开后再次检查位置
          setTimeout(() => {
            if (this.isPopupVisible.value) {
              this.adjustForExpandedPopup(true);
            }
          }, 100);
        }, 300);
      }

      // 9. 重置动画状态
      this.isPopupAnimating = false;
    } catch (error) {
      console.error('Popup transition error:', error);
      // 确保状态被重置
      this.isPopupAnimating = false;
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

  // 调整地图以适应弹出层 - 添加防止缩放冲突的逻辑
  async adjustMapForPopup(
    map: Map,
    position: number[],
    forceCheck = false,
    callback?: () => void
  ) {
    // 如果地图正在进行动画（比如聚合点放大），则不调整视图
    if (map.getView().getAnimating() || this.isMapZooming) {
      if (callback) callback();
      return Promise.resolve();
    }

    const view = map.getView();
    const mapSize = map.getSize();
    const popupWidth = 300; // 基本弹窗宽度(像素)
    if (!mapSize || !this.popupContainer) {
      if (callback) callback();
      return Promise.resolve();
    }

    // 获取弹窗的实际尺寸
    const popupRect = this.popupContainer.getBoundingClientRect();
    const mapRect = map.getTargetElement().getBoundingClientRect();

    // 将点位置转换为屏幕像素坐标
    const pixel = map.getPixelFromCoordinate(position);
    if (!pixel) {
      if (callback) callback();
      return Promise.resolve();
    }

    // 使用实际的弹窗高度而不是固定值
    const popupHeight = popupRect.height;
    const safeMargin = 20; // 基本安全边距
    const headerOffset = 40; // 增加顶部Header偏移量
    const extraRightSpace = this.openSubPopup.value ? 400 : 120; // 根据副弹窗状态调整右侧空间

    // 估计弹窗在屏幕上的位置
    const popupTop = pixel[1] - popupHeight - 15;
    const popupBottom = pixel[1] + 35;
    const popupLeft = pixel[0] - popupWidth / 2;
    const popupRight = pixel[0] + popupWidth / 2;

    const viewportWidth = mapRect.width;
    const viewportHeight = mapRect.height;

    let needToMove = forceCheck;
    let panX = 0;
    let panY = 0;

    // 检查垂直方向，增加额外的上边界空间
    if (popupTop < headerOffset) {
      needToMove = true;
      panY = headerOffset - popupTop + safeMargin + 20; // 增加额外的上边界空间
    } else if (popupBottom > viewportHeight - safeMargin) {
      needToMove = true;
      panY = viewportHeight - safeMargin - popupBottom;
    }

    // 检查水平方向
    if (popupLeft < safeMargin) {
      needToMove = true;
      panX = safeMargin - popupLeft;
    } else if (popupRight + extraRightSpace > viewportWidth - safeMargin) {
      needToMove = true;
      panX = viewportWidth - safeMargin - (popupRight + extraRightSpace);
    }

    if (needToMove) {
      const resolution = view.getResolution() || 1;
      const extraOffsetY = panY !== 0 ? Math.sign(panY) * 40 : 0; // 增加垂直方向的额外偏移
      const extraOffsetX = panX !== 0 ? Math.sign(panX) * 30 : 0;
      const currentCenter = view.getCenter();

      if (!currentCenter) {
        if (callback) callback();
        return Promise.resolve();
      }

      // 直接执行单个动画，同时处理水平和垂直方向
      return new Promise<void>(resolve => {
        view.animate(
          {
            center: [
              currentCenter[0] - (panX + extraOffsetX) * resolution,
              currentCenter[1] + (panY + extraOffsetY) * resolution,
            ],
            duration: 300,
            easing: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
          },
          () => {
            if (callback) callback();
            resolve();
          }
        );
      });
    }

    if (callback) callback();
    return Promise.resolve();
  }

  // 调整弹窗位置函数 - 添加防止缩放冲突的逻辑
  adjustPopupPosition(forceAdjust = false) {
    if (
      !this.currentPosition ||
      !this.popupContainer ||
      !this.map ||
      this.isPopupAnimating ||
      this.isMapZooming // 如果地图正在缩放中，不调整弹窗位置
    )
      return;

    // 获取当前弹窗的实际尺寸
    const popupRect = this.popupContainer.getBoundingClientRect();
    const mapRect = this.map.getTargetElement().getBoundingClientRect();

    // 检查弹窗是否超出视口边界
    let needAdjust = forceAdjust; // 如果强制调整，则始终进行调整
    let adjustX = 0;
    let adjustY = 0;

    // 安全边距
    const safeMargin = 30;
    const headerOffset = 30; // 顶部Header偏移量

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
      // console.log('需要调整弹窗位置', { adjustX, adjustY });
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

  // 特别为展开副弹窗准备的调整方法 - 添加防止缩放冲突的逻辑
  async adjustForExpandedPopup(isExpanded: boolean) {
    if (!this.currentPosition || !this.map || this.isMapZooming) return;

    // 设置动画中状态，避免重复调整
    this.isPopupAnimating = true;

    try {
      const view = this.map.getView();
      const popupRect = this.popupContainer.getBoundingClientRect();
      const mapRect = this.map.getTargetElement().getBoundingClientRect();

      // console.log('adjustForExpandedPopup called', {
      //   isExpanded,
      //   popupRect,
      //   mapRect,
      //   headerOffset,
      // });

      if (isExpanded) {
        // 展开时，只需要确保副弹窗完全可见
        const resolution = view.getResolution() || 1;
        const currentCenter = view.getCenter();
        if (!currentCenter) {
          this.isPopupAnimating = false;
          return;
        }

        // 1. 计算副弹窗的宽度和位置
        const mainPopupWidth = popupRect.width;
        const subPopupWidth = mainPopupWidth * 0.8; // 基于CSS中的80%宽度

        // 2. 计算副弹窗的右边界位置
        const subPopupRight = popupRect.right + subPopupWidth;

        // 3. 检查副弹窗是否超出视口右侧边界
        const viewportRightEdge = mapRect.right - 40; // 40px安全边距

        // 4. 只有当副弹窗会超出右侧边界时才调整
        if (subPopupRight > viewportRightEdge) {
          // 计算需要的水平偏移量 - 确保副弹窗完全可见
          const pixelOffsetX = subPopupRight - viewportRightEdge;

          // 将像素偏移转换为地图坐标偏移，只移动必要的距离
          const coordOffsetX = pixelOffsetX * resolution;

          // 构建新的中心坐标，只调整水平方向
          const newCenter = [currentCenter[0] + coordOffsetX, currentCenter[1]];

          // 使用平滑动画移动地图
          await new Promise<void>(resolve => {
            view.animate(
              {
                center: newCenter,
                duration: 350,
                easing: t => {
                  // 使用简单的缓入缓出
                  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                },
              },
              () => resolve()
            );
          });
        }
      } else if (this.currentPosition) {
        // 收起时，如果标点已经被移出了视口，则调整视图让其回到合理位置
        const pixel = this.map.getPixelFromCoordinate(this.currentPosition);
        if (!pixel) {
          this.isPopupAnimating = false;
          return;
        }

        const currentCenter = view.getCenter();
        if (!currentCenter) {
          this.isPopupAnimating = false;
          return;
        }

        // 检查点位置是否太靠近视口右边缘
        const viewportRightEdge = mapRect.right - 80; // 安全边距

        // 只有当偏移过大才调整
        if (pixel[0] > viewportRightEdge) {
          const resolution = view.getResolution() || 1;
          const pixelOffsetX = pixel[0] - viewportRightEdge + 40; // 确保有足够空间

          const newCenter = [
            currentCenter[0] + pixelOffsetX * resolution,
            currentCenter[1],
          ];

          await new Promise<void>(resolve => {
            view.animate(
              {
                center: newCenter,
                duration: 250,
              },
              () => resolve()
            );
          });
        }
      }

      // 在调整副弹窗位置时，同时检查并调整垂直位置
      if (popupRect.top < mapRect.top + 30) {
        // 添加顶部Header偏移量
        const currentCenter = view.getCenter();
        if (!currentCenter) {
          this.isPopupAnimating = false;
          return;
        }

        const resolution = view.getResolution() || 1;
        const pixelOffsetY = mapRect.top + 30 - popupRect.top;
        const coordOffsetY = pixelOffsetY * resolution;

        // 垂直方向调整
        const newCenter = [currentCenter[0], currentCenter[1] - coordOffsetY];

        await new Promise<void>(resolve => {
          view.animate(
            {
              center: newCenter,
              duration: 250,
            },
            () => resolve()
          );
        });
      }
    } catch (error) {
      console.error('副弹窗视图调整错误:', error);
    } finally {
      // 确保标志位被重置
      setTimeout(() => {
        this.isPopupAnimating = false;
      }, 50);
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

  // 重置动画状态，用于确保缩放后弹窗功能正常
  resetAnimationState() {
    // 清除动画标志，确保弹窗响应能力恢复
    this.isPopupAnimating = false;
  }
}
