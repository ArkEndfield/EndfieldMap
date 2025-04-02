<template>
  <div class="map-container">
    <div
      id="map"
      class="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center"
    ></div>

    <MapControls
      :map="map as Map"
      v-model:zoomLevel="zoomLevel"
      ref="mapControlsRef"
    />

    <MapPopup
      v-model:is-popup-visible="isPopupVisible"
      :entity="entity"
      v-model:show-video-info="showVideoInfo"
      v-model:open-sub-popup="openSubPopup"
    />
  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref,
  onBeforeUnmount,
  provide,
  nextTick,
  watch,
  shallowRef,
  computed,
} from 'vue';
import {
  cacheMapId,
  createMap,
  map,
  cleanupMap,
} from './components/map/MapCore';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { Map } from 'ol';
import Overlay from 'ol/Overlay';
import { PopupManager } from './components/map/PopupManager';
import MapControls from './components/map/MapControls.vue';
import MapPopup from './components/map/MapPopup.vue';
import { type PointData } from './data/points';
import { debounce, throttle } from './utils/common';
import { updateClusterDistance } from './data/entity';

// 状态变量
// const map = ref<Map | null>(null);
const zoomLevel = ref(3);
const isPopupVisible = ref(false);
const showVideoInfo = ref(false);
const openSubPopup = ref(false);
const entity = ref<PointData | null>(null);

// 引用DOM元素
const mapControlsRef = ref();

// 全局变量
let overlay: Overlay;
let selectInteraction: Select;
const popupManager = shallowRef<PopupManager | null>(null);

// 提供弹出层管理器给子组件 - 在setup顶层调用provide
provide(
  'popupManager',
  computed(() => popupManager.value)
);

onMounted(async () => {
  // 创建弹出层
  overlay = new Overlay({
    element: document.createElement('div'), // 临时元素，将在PopupManager中替换
    autoPan: false,
    offset: [0, 10],
    positioning: 'bottom-center',
  });

  // 使用模块化的方式初始化地图
  createMap(cacheMapId.value, mapControlsRef.value.controls, overlay);

  // 等待Vue更新DOM后获取弹出层容器
  // 使用微任务队列等待DOM更新
  await nextTick();

  // 确保MapPopup组件已挂载，并添加额外的等待时间
  await new Promise(resolve => setTimeout(resolve, 200));

  // 获取弹出层容器的引用 - 使用组件实例的$el属性
  const mapPopupEl = document.querySelector('.ol-popup') as HTMLElement;

  if (mapPopupEl) {
    // console.log('找到弹出层元素:', mapPopupEl);

    // 更新Overlay的元素
    overlay.setElement(mapPopupEl);

    // 创建弹出层管理器
    popupManager.value = new PopupManager(
      map.value as Map,
      overlay,
      mapPopupEl,
      isPopupVisible,
      entity,
      showVideoInfo,
      openSubPopup
    );
  } else {
    console.error('弹出层容器未找到 - 请检查DOM和CSS');
  }

  // 使用节流函数处理缩放事件，确保UI更新更加平滑
  const handleZoomChange = throttle(
    function () {
      const currentMap = map.value;
      if (!currentMap) return;

      // 标记地图正在缩放中
      if (popupManager.value) {
        popupManager.value.setMapZooming(true);
      }

      const zoom = currentMap.getView().getZoom() || 0;
      // 四舍五入到最接近的0.5，使缩放值更稳定
      const stableZoom = Math.round(zoom * 2) / 2;

      // 只在真正需要更新时才更新UI值
      if (Math.abs(zoomLevel.value - stableZoom) >= 0.1) {
        zoomLevel.value = stableZoom;
      }

      updateClusterDistance(zoomLevel.value);
    },
    150, // 增加到150ms，避免过于频繁的更新
    { leading: true, trailing: true }
  );

  // 监听地图缩放事件，使用节流函数处理UI更新
  map.value?.getView().on('change:resolution', handleZoomChange);

  // 监听地图移动结束事件，确保最终值是准确的
  map.value?.on(
    'moveend',
    debounce(
      () => {
        const currentMap = map.value;
        if (!currentMap) return;

        const zoom = currentMap.getView().getZoom() || 0;
        // 四舍五入到最接近的0.5，保持与handleZoomChange相同的舍入策略
        const stableZoom = Math.round(zoom * 2) / 2;

        // 确保最终值是准确的
        if (Math.abs(zoomLevel.value - stableZoom) >= 0.01) {
          zoomLevel.value = stableZoom;
        }

        // 重要：在移动或缩放结束后，重置缩放状态标志
        if (popupManager.value) {
          popupManager.value.setMapZooming(false);

          // 如果弹窗当前可见，在缩放结束后延迟检查并调整位置
          setTimeout(() => {
            if (
              isPopupVisible.value &&
              popupManager.value?.getCurrentPosition()
            ) {
              popupManager.value.resetAnimationState();
              if (openSubPopup.value) {
                popupManager.value.adjustForExpandedPopup(true);
              } else {
                popupManager.value.adjustPopupPosition(true);
              }
            }
          }, 100);
        }
      },
      250,
      { leading: false, trailing: true }
    )
  );

  // 添加选择交互
  selectInteraction = new Select({
    condition: click,
    style: null,
    layers: () => true,
  });

  map.value?.addInteraction(selectInteraction);

  // 添加地图点击事件处理，处理点击空白区域关闭弹窗
  map.value?.on('click', function (event) {
    // 首先检查是否有Feature被点击
    const feature = map.value?.forEachFeatureAtPixel(
      event.pixel,
      feature => feature
    );

    // 如果没有Feature被点击，并且弹窗正在显示，则关闭弹窗
    if (!feature && isPopupVisible.value && popupManager.value) {
      // 不要直接调用closeToast，而是通过设置isPopupVisible为false来触发正常的关闭流程
      isPopupVisible.value = false;
      // 这样会触发弹窗的离开动画，因为Vue的v-show监听了这个值
    }
  });

  // 修改选择交互部分的代码，先关闭弹窗，再放大聚合点
  selectInteraction.on('select', async function (event) {
    const currentMap = map.value;
    if (!currentMap) return;

    const target = event.selected[0];
    if (target) {
      // 检查是否是聚合点
      const features = target.get('features');
      if (features && features.length > 1) {
        // 聚合点点击处理
        // 如果有弹窗正在显示，先关闭它
        if (isPopupVisible.value) {
          isPopupVisible.value = false;
          // 等待弹窗关闭动画完成
          await new Promise(resolve => setTimeout(resolve, 250));
        }

        const extent = target.getGeometry()?.getExtent();
        if (extent && currentMap) {
          // 放大到聚合范围
          currentMap.getView().fit(extent, {
            duration: 500,
            padding: [50, 50, 50, 50],
            maxZoom: 5,
          });
        }
        return;
      }

      // 获取单个点的数据
      let data = target.get('payload');
      // 如果是聚合中的单个点，需要从features中获取
      if (features && features.length === 1) {
        data = features[0].get('payload');
      }

      if (!data) return;

      const newPosition = event.mapBrowserEvent.coordinate;
      const currentPosition = popupManager.value?.getCurrentPosition();
      const positionChanged =
        !currentPosition ||
        newPosition[0] !== currentPosition[0] ||
        newPosition[1] !== currentPosition[1];

      if (!popupManager.value) return;

      // 如果位置改变或弹出框当前不可见
      if (positionChanged || !isPopupVisible.value) {
        if (isPopupVisible.value) {
          // 如果弹窗已经显示，使用PopupManager处理关闭和重新打开
          // 这个方法会先完全关闭当前弹窗，然后再在新位置打开
          await popupManager.value.closeAndReopenPopup(data, newPosition);
        } else {
          // 首次显示弹窗
          entity.value = data;
          showVideoInfo.value = false;
          popupManager.value.setCurrentPosition([...newPosition]);

          // 先设置弹窗位置，但不显示
          overlay.setPosition(newPosition);

          // 预先调整地图中心，确保弹窗完全可见
          await popupManager.value.adjustMapForPopup(
            currentMap as Map,
            newPosition,
            false,
            async () => {
              // 等待地图动画完成
              await new Promise(resolve => setTimeout(resolve, 50));

              // 调整完成后再显示弹窗
              requestAnimationFrame(() => {
                if (popupManager.value) {
                  popupManager.value.resetAnimationState();
                  isPopupVisible.value = true;

                  // 弹窗显示后额外检查位置
                  setTimeout(() => {
                    if (popupManager.value && isPopupVisible.value) {
                      popupManager.value.adjustPopupPosition(true);
                    }
                  }, 300);
                }
              });
            }
          );
        }
      } else {
        // 如果是同一位置的点击，只更新弹窗内容，不关闭再打开
        entity.value = data;
      }
    } else {
      // 只有当没有选中新Feature时才关闭弹窗
      if (event.selected.length === 0 && event.deselected.length > 0) {
        isPopupVisible.value = false;
      }
    }
  });

  // 监听openSubPopup的变化，确保视图正确调整
  watch(openSubPopup, newValue => {
    // console.log('openSubPopup changed to', newValue);
    if (isPopupVisible.value && popupManager.value) {
      // 先重置动画状态，确保弹窗可以调整位置
      popupManager.value.resetAnimationState();

      // 调整视图 - 改为单次调整，减少多次位移
      setTimeout(() => {
        // 仅调整展开/收起状态
        popupManager.value?.adjustForExpandedPopup(newValue);

        // 不再需要额外的位置调整，因为adjustForExpandedPopup已经考虑了所有必要的位置调整
        // 如果必要，可以加入一个轻微的最终调整，但右侧距离较小
        if (newValue) {
          // 仅在展开时做轻微调整
          setTimeout(() => {
            popupManager.value?.resetAnimationState();
            // 使用较小的forceAdjust参数，减少调整幅度
            popupManager.value?.adjustPopupPosition(false);
          }, 350);
        }
      }, 50);
    }
  });

  // 当窗口大小改变时，也需要检查弹窗位置
  window.addEventListener('resize', () => {
    if (
      isPopupVisible.value &&
      popupManager.value &&
      popupManager.value.getCurrentPosition()
    ) {
      // 窗口大小变化时强制调整位置
      setTimeout(() => {
        if (openSubPopup.value) {
          // 如果副弹窗已展开，优先调整到副弹窗中心
          popupManager.value?.adjustForExpandedPopup(true);
        } else {
          // 否则，常规位置调整
          popupManager.value?.adjustPopupPosition(true);
        }
      }, 100);
    }
  });

  // 修改 closeToast 方法的处理
  watch(isPopupVisible, newValue => {
    if (!newValue) {
      // 当弹出框关闭时，清除选择状态
      selectInteraction.getFeatures().clear();

      // 确保弹窗信息被清理，但要在动画完成后
      setTimeout(() => {
        if (!isPopupVisible.value) {
          // 再次检查，避免在动画中途重新打开的情况
          showVideoInfo.value = false;
          openSubPopup.value = false;
          // 最后才清除位置，确保动画完成
          setTimeout(() => {
            if (!isPopupVisible.value) {
              popupManager.value?.setCurrentPosition(undefined);
              overlay.setPosition(undefined);
            }
          }, 250);
        }
      }, 250); // 等待动画完成
    }
  });
});

// 组件卸载前执行清理工作
onBeforeUnmount(() => {
  console.log('组件卸载，清理资源');

  // 移除全局事件监听器
  window.removeEventListener('resize', () => {});

  // 释放弹窗管理器
  popupManager.value = null;

  // 清除选择交互状态
  if (selectInteraction) {
    selectInteraction.getFeatures().clear();
    if (map.value) {
      map.value.removeInteraction(selectInteraction);
    }
    selectInteraction = null as any;
  }

  // 清理overlay
  if (overlay) {
    if (map.value) {
      map.value.removeOverlay(overlay);
    }
    overlay = null as any;
  }

  // 使用增强的地图清理函数
  cleanupMap();

  // 销毁地图实例 (额外保障)
  if (map.value) {
    map.value.setTarget(undefined);
    map.value = null;
  }
});

// 监听地图切换
watch(
  () => cacheMapId.value,
  async newValue => {
    console.log(`开始切换地图到: ${newValue}`);

    // 关闭可能打开的弹窗
    isPopupVisible.value = false;
    showVideoInfo.value = false;
    openSubPopup.value = false;
    popupManager.value?.setCurrentPosition(undefined);
  },
  { flush: 'post' } // 确保在 DOM 更新后执行
);
</script>

<style lang="scss">
.map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 防止内容溢出 */
}

#map {
  background-image: url('/assets/map_bg.png');
  transform: translate3d(0, 0, 0); /* 使用硬件加速 */
  backface-visibility: hidden; /* 提高渲染性能 */
  will-change: transform; /* 告知浏览器此元素将发生变换，提前准备 */
}

/* 增强地图图层渲染性能 */
.ol-layer {
  /* 禁用透明度过渡，因为会导致闪烁 */
  transition: none !important;
  transform: translate3d(0, 0, 0); /* 使用硬件加速 */
  will-change: contents; /* 告知浏览器内容会变化 */
  backface-visibility: hidden; /* 提高渲染性能 */
}

/* OpenLayers Canvas 元素处理 */
.ol-layer canvas {
  /* 重要：禁用canvas的透明度渐变效果，它是闪烁的主要原因 */
  transition: none !important;
  transform: translate3d(0, 0, 0);
  image-rendering: high-quality; /* 高质量图像渲染 */
}

/* 适用于点位图标的样式 */
.ol-style-icon,
.ol-style-circle,
.ol-style-regularshape {
  /* 这些元素不应该有动画过渡，因为会导致闪烁 */
  transition: none !important;
  will-change: auto; /* 让浏览器自己决定是否优化 */
}

/* 弹出层容器的样式 */
.ol-popup {
  $border-color: rgba(206, 206, 206, 0.5);
  $border-size: 0.2em;

  /* 仅为弹窗本身应用过渡效果，不影响地图元素 */
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: bottom center;
  will-change: transform, opacity;

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0 !important;
    transform: scaleY(0) !important;
    display: block !important;
  }

  &.v-enter-active,
  &.v-leave-active {
    display: block !important;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  &.v-enter-to,
  &.v-leave-from {
    opacity: 1;
    transform: scaleY(1);
    display: block !important;
  }

  .pop-drop {
    transition: top 0.5s ease, right 0.5s ease, width 0.5s ease;
    filter: drop-shadow(0 $border-size 0 $border-color)
      drop-shadow(0 calc(0px - $border-size) 0 $border-color)
      drop-shadow($border-size 0 0 $border-color)
      drop-shadow(calc(0px - $border-size) 0 0 $border-color);
    &.unfold {
      width: 75%;
      top: 0;
      right: calc(-75% - 0.5em);
    }
  }

  .pop-content {
    transition: top 0.5s ease, right 0.5s ease;
    filter: drop-shadow(0 $border-size 0 $border-color)
      drop-shadow(0 calc(0px - $border-size) 0 $border-color)
      drop-shadow($border-size 0 0 $border-color)
      drop-shadow(calc(0px - $border-size) 0 0 $border-color)
      drop-shadow(0 0 0.4em rgba(0, 0, 0, 0.5));
  }
}
</style>
