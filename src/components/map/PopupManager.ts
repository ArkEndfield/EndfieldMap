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
    this.isPopupVisible.value = false;
    this.showVideoInfo.value = false; // 重置显示状态
    this.currentPosition = undefined;
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
    console.log('PopupManager: 开始进入动画');
    this.isPopupAnimating = true;

    try {
      // 使用更简单的动画方法 - 只用scaleY变换
      el.setAttribute('style', 'opacity: 0; transform: scaleY(0);');

      // 使用基本动画 - 加快速度
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          el.setAttribute(
            'style',
            'opacity: 1; transform: scaleY(1); transition: opacity 0.2s ease, transform 0.2s ease;'
          );
          setTimeout(() => {
            this.isPopupAnimating = false;

            // 动画完成后调整位置
            if (this.isPopupVisible.value && this.currentPosition) {
              this.adjustPopupPosition(true);
            }

            resolve();
            onComplete();
          }, 200); // 减少等待时间
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
    console.log('PopupManager: 开始离开动画');
    this.openSubPopup.value = false; // 关闭子弹窗
    this.isPopupAnimating = true;

    try {
      // 使用更简单的动画方法
      el.setAttribute(
        'style',
        'opacity: 1; transform: scaleY(1); transition: opacity 0.2s ease, transform 0.2s ease;'
      );

      // 使用基本动画 - 加快速度
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          el.setAttribute(
            'style',
            'opacity: 0; transform: scaleY(0); transition: opacity 0.2s ease, transform 0.2s ease;'
          );
          setTimeout(() => {
            this.isPopupAnimating = false;
            resolve();
            onComplete();
          }, 200); // 减少等待时间
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
    // 关闭当前弹出层
    this.isPopupVisible.value = false;

    // 等待关闭动画完成
    await new Promise(resolve => setTimeout(resolve, 350));

    // 更新实体数据
    this.entity.value = data;
    this.showVideoInfo.value = false;

    // 保存新位置
    this.currentPosition = [...newPosition];

    // 设置弹出层位置
    this.overlay.setPosition(newPosition);

    // 调整地图中心位置，然后显示弹出层
    await this.adjustMapForPopup(this.map, newPosition, () => {
      this.isPopupVisible.value = true;
    });
  }

  // 调整地图以适应弹出层
  async adjustMapForPopup(map: Map, position: number[], callback?: () => void) {
    const view = map.getView();
    const mapSize = map.getSize();
    const popupWidth = 300; // 基本弹窗宽度(像素)
    if (!mapSize || !this.popupContainer) {
      if (callback) callback();
      return;
    }

    // 设置标志位，避免同时触发多次调整
    this.isPopupAnimating = true;

    // 获取地图容器的边界
    const mapRect = map.getTargetElement().getBoundingClientRect();

    // 增加弹窗的估计高度和宽度，确保有足够空间
    const popupHeight = 120; // 基本弹窗高度(像素)
    const safeMargin = 20; // 基本安全边距
    const headerOffset = 20; // 顶部Header偏移量

    // 如果副弹窗可能展开，需要考虑额外的空间，但不要预留太多
    const extraRightSpace = 120; // 减少副弹窗可能占用的额外空间估计

    // 将点位置转换为屏幕像素坐标
    const pixel = map.getPixelFromCoordinate(position);
    if (!pixel) {
      if (callback) callback();
      return;
    }

    // 估计弹窗在屏幕上的位置
    const popupTop = pixel[1] - popupHeight - 15; // 顶部额外安全空间
    const popupBottom = pixel[1] + 35; // 底部箭头高度估算
    const popupLeft = pixel[0] - popupWidth / 2;
    const popupRight = pixel[0] + popupWidth / 2;

    const viewportWidth = mapRect.width;
    const viewportHeight = mapRect.height;

    let needToMove = false;
    let panX = 0;
    let panY = 0;

    // 检查是否需要调整视图 - 考虑基本弹窗位置
    if (popupTop < safeMargin + headerOffset) {
      // 添加顶部Header偏移量
      needToMove = true;
      panY = safeMargin + headerOffset - popupTop;
    }

    if (popupBottom > viewportHeight - safeMargin) {
      needToMove = true;
      panY = viewportHeight - safeMargin - popupBottom;
    }

    if (popupLeft < safeMargin) {
      needToMove = true;
      panX = safeMargin - popupLeft;
    }

    // 考虑副弹窗可能展开的情况，预留右侧空间
    if (popupRight + extraRightSpace > viewportWidth - safeMargin) {
      needToMove = true;
      // 为副弹窗预留更多空间
      panX = viewportWidth - safeMargin - (popupRight + extraRightSpace);
    }

    if (needToMove) {
      const resolution = view.getResolution() || 1;
      const extraOffsetY = panY !== 0 ? Math.sign(panY) * 30 : 0;
      const extraOffsetX = panX !== 0 ? Math.sign(panX) * 30 : 0;
      const currentCenter = view.getCenter();

      if (!currentCenter) {
        this.isPopupAnimating = false;
        if (callback) callback();
        return;
      }

      const newCenter = [
        currentCenter[0] - (panX + extraOffsetX) * resolution,
        currentCenter[1] + (panY + extraOffsetY) * resolution,
      ];

      // 使用动画，完成后调用回调
      await new Promise<void>(resolve => {
        view.animate(
          {
            center: newCenter,
            duration: 300,
          },
          () => {
            requestAnimationFrame(() => {
              this.isPopupAnimating = false;
              resolve();
            });
          }
        );
      });

      if (callback) callback();
    } else {
      this.isPopupAnimating = false;
      if (callback) callback();
    }
  }

  // 调整弹窗位置函数 - 用于在内容变化后重新检查位置
  adjustPopupPosition(forceAdjust = false) {
    if (
      !this.currentPosition ||
      !this.popupContainer ||
      !this.map ||
      this.isPopupAnimating
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
      console.log('需要调整弹窗位置', { adjustX, adjustY });
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

  // 特别为展开副弹窗准备的调整方法
  async adjustForExpandedPopup(isExpanded: boolean) {
    if (!this.currentPosition || !this.map || this.isPopupAnimating) return;

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
        if (!currentCenter) return;

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

          console.log('副弹窗超出边界，计算偏移量', {
            subPopupRight,
            viewportRightEdge,
            pixelOffsetX,
            resolution,
          });

          // 将像素偏移转换为地图坐标偏移，只移动必要的距离
          const coordOffsetX = pixelOffsetX * resolution;

          // 构建新的中心坐标，只调整水平方向
          const newCenter = [currentCenter[0] + coordOffsetX, currentCenter[1]];

          console.log('调整地图中心，确保副弹窗可见', {
            currentCenter,
            newCenter,
            coordOffsetX,
          });

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
        if (!pixel) return;

        const currentCenter = view.getCenter();
        if (!currentCenter) return;

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
        if (!currentCenter) return;

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
}
