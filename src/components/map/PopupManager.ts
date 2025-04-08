import { ref, Ref, watch } from 'vue';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { PointData } from '@/data/points';
import { xyz2crd } from '@/utils/common';

export class PopupManager {
  private map: Map;
  private overlay: Overlay;
  private popupContainer: HTMLElement;
  public isPopupVisible: Ref<boolean> = ref(false);
  private currentPosition: number[] | undefined;
  private isPopupAnimating = false;
  private entity: Ref<PointData | null>;
  private showVideoInfo: Ref<boolean>;
  private openSubPopup: Ref<boolean>;
  private isMapZooming = false; // 添加地图缩放状态标记

  constructor(
    map: Map,
    overlay: Overlay,
    popupContainer: HTMLElement,
    entity: Ref<PointData | null>,
    showVideoInfo: Ref<boolean>,
    openSubPopup: Ref<boolean>
  ) {
    this.map = map;
    this.overlay = overlay;
    this.popupContainer = popupContainer;
    this.entity = entity;
    this.showVideoInfo = showVideoInfo;
    this.openSubPopup = openSubPopup;
  }

  // 关闭弹出层
  closeToast() {
    this.isPopupVisible.value = false;
  }

  async openToast() {
    this.isPopupVisible.value = true;
    this.repositionPopup();

    // 等待animation完成后再调整位置，防止与motion动画冲突
    await new Promise(resolve => setTimeout(resolve, 350));

    // 确保动画已经完成后再调整位置
    if (this.isPopupVisible.value) {
      this.adjustPopupPosition();
    }
  }

  addVisibilityChangeListener(callback: (visible: boolean) => void) {
    return watch(this.isPopupVisible, callback);
  }

  // 切换视频信息显示状态
  toggleVideoInfo(show: boolean) {
    this.showVideoInfo.value = show;
  }

  // 切换子弹窗显示状态
  toggleSubPopup() {
    // 先确保重置动画状态，防止上一次的动画状态阻止本次调整
    this.isPopupAnimating = false;

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
      // 确保重置动画状态，使得此次调整可以生效
      this.isPopupAnimating = false;

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
      console.log('开始关闭和重新打开弹窗');
      // 1. 先关闭副弹窗
      this.openSubPopup.value = false;

      // 2. 开始关闭当前弹窗
      this.closeToast();
      console.log('开始等待关闭');
      console.time('关闭动画时间');
      // 3. 等待关闭动画完成
      await new Promise(resolve => setTimeout(resolve, 250));
      console.timeEnd('关闭动画时间');
      console.log('完成关闭');

      // 4. 更新数据和位置
      this.entity.value = newData;
      this.showVideoInfo.value = false;
      this.currentPosition = popupPosition;
      this.overlay.setPosition(popupPosition);
      // 5. 展开新弹窗
      await this.openToast();

      // 8. 如果之前是展开状态，检查新标点是否有奖励，只有有奖励时才展开副弹窗
      if (wasExpanded) {
        // 导入 shouldShowRewards 函数
        const { shouldShowRewards } = await import('@/data/reward');
        const hasRewards = shouldShowRewards(newData);

        if (hasRewards) {
          setTimeout(() => {
            this.openSubPopup.value = true;
            // 展开后再次检查位置
            setTimeout(() => {
              if (this.isPopupVisible.value) {
                this.adjustForExpandedPopup(true);
              } else {
                this.adjustPopupPosition(true);
              }
            }, 100);
          }, 300);
        }
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

  // 调整弹窗位置函数 - 添加防止缩放冲突的逻辑
  adjustPopupPosition(forceAdjust = false) {
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
        const subPopupWidth = mainPopupWidth * 0.75; // 减小副弹窗宽度与CSS保持一致(75%)

        // 2. 计算副弹窗的右边界位置
        const subPopupRight = popupRect.right + subPopupWidth;

        // 3. 检查副弹窗是否超出视口右侧边界
        const viewportRightEdge = mapRect.right - 100; // 进一步减小安全边距到5px

        // 4. 只有当副弹窗会超出右侧边界时才调整
        if (subPopupRight > viewportRightEdge) {
          // 计算需要的水平偏移量 - 确保副弹窗完全可见，不再添加额外空间
          const pixelOffsetX = (subPopupRight - viewportRightEdge) * 0.9; // 只调整90%的距离，避免过度移动

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

        // 检查点位置是否太靠近视口右边缘 - 保持30px的安全边距
        const viewportRightEdge = mapRect.right + 30; // 适当调整安全边距

        // 只有当偏移过大才调整
        if (pixel[0] > viewportRightEdge) {
          const resolution = view.getResolution() || 1;
          const pixelOffsetX = pixel[0] - viewportRightEdge + 20; // 减小额外空间

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
