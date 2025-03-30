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
  updateMap,
} from './components/map/MapCore';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { Map } from 'ol';
import Overlay from 'ol/Overlay';
import { PopupManager } from './components/map/PopupManager';
import MapControls from './components/map/MapControls.vue';
import MapPopup from './components/map/MapPopup.vue';
import {
  updateClusterDistance,
  forceDisperseAtMaxZoom,
  updateCurrentZoom,
  refresh,
  reinitializeEntityLayers,
} from './data/entity';
import { loadTextPoints } from './data/locations';
import { type PointData } from './data/points';
import { updatePoints } from './data/points';

// 状态变量
// const map = ref<Map | null>(null);
const zoomLevel = ref(3);
const isPopupVisible = ref(false);
const showVideoInfo = ref(false);
const openSubPopup = ref(false);
const entity = ref<PointData>({
  sceneId: '',
  seq: 1,
  entityDataIdKey: '',
  position: { x: 0, y: 0, z: 0 },
});

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

  // 监听地图渲染完成事件，确保图层正确添加
  map.value?.once('rendercomplete', () => {
    refresh();
  });

  // 监听地图缩放事件
  map.value?.getView().on('change:resolution', function () {
    const currentMap = map.value;
    if (!currentMap) return;

    const zoom = currentMap.getView().getZoom() || 0;
    // 更新本地状态和步进条
    zoomLevel.value = zoom;
    loadTextPoints(true, zoom > 3);

    // 更新聚合距离
    updateClusterDistance(zoom);

    // 更新当前缩放级别，这会触发图标大小的更新
    updateCurrentZoom(zoom);

    // 在最大缩放级别时强制禁用聚合
    if (zoom >= 5) {
      forceDisperseAtMaxZoom(zoom);
    }
  });

  // 监听鼠标滚轮和其他缩放事件，确保步进条同步
  map.value?.on('moveend', () => {
    const currentMap = map.value;
    if (!currentMap) return;

    // 获取当前缩放级别并更新步进条
    const zoom = currentMap.getView().getZoom() || 0;
    zoomLevel.value = zoom;
  });

  // 添加选择交互
  selectInteraction = new Select({
    condition: click,
    style: null,
    layers: () => true,
  });

  map.value?.addInteraction(selectInteraction);

  map.value?.on('click', function (event) {
    console.log(event.coordinate);
  });

  selectInteraction.on('select', async function (event) {
    const currentMap = map.value;
    if (!currentMap) return;

    const target = event.selected[0];
    if (target) {
      // 检查是否是聚合点
      const features = target.get('features');
      if (features && features.length > 1) {
        // 处理聚合点击 - 放大地图或显示聚合列表
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

      // 如果位置改变或弹出框当前不可见，则重新打开弹出框
      if (positionChanged || !isPopupVisible.value) {
        if (isPopupVisible.value) {
          // 使用PopupManager处理弹出层关闭和重新打开
          await popupManager.value.closeAndReopenPopup(data, newPosition);
        } else {
          // 首次显示
          entity.value = data;
          showVideoInfo.value = false;
          popupManager.value.setCurrentPosition([...newPosition]);

          // 先设置弹窗位置，但不显示
          overlay.setPosition(newPosition);

          // 预先调整地图中心，确保弹窗完全可见
          await popupManager.value.adjustMapForPopup(
            currentMap as Map,
            newPosition,
            () => {
              // 动画完成后才显示弹窗
              isPopupVisible.value = true;

              // 弹窗显示后额外检查位置
              setTimeout(() => {
                popupManager.value?.adjustPopupPosition(true);
              }, 300); // 等待弹窗动画完成后再次检查位置
            }
          );
        }
      } else {
        // 如果是同一位置，重新打开弹出框
        await popupManager.value.closeAndReopenPopup(data, newPosition);
      }
    } else {
      isPopupVisible.value = false;
      showVideoInfo.value = false;
      popupManager.value?.setCurrentPosition(undefined);
    }
  });

  // 监听openSubPopup的变化，确保视图正确调整
  watch(openSubPopup, newValue => {
    // console.log('openSubPopup changed to', newValue);
    if (isPopupVisible.value && popupManager.value) {
      // 等待DOM更新后调整视图，只调整一次即可
      setTimeout(() => {
        popupManager.value?.adjustForExpandedPopup(newValue);
      }, 100);
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
    }
  });
});

// 组件卸载前执行清理工作
onBeforeUnmount(() => {
  // 移除全局事件监听器
  window.removeEventListener('resize', () => {});

  // 销毁地图实例
  if (map.value) {
    map.value.setTarget(undefined);
  }
});

// 监听地图更换
watch(
  () => cacheMapId.value,
  async newValue => {
    // 关闭可能打开的弹窗
    isPopupVisible.value = false;
    showVideoInfo.value = false;
    popupManager.value?.setCurrentPosition(undefined);

    // 更新点位数据
    updatePoints(newValue);

    // 等待 Vue 更新完成
    await nextTick();

    // 重新初始化实体图层
    reinitializeEntityLayers();

    // 等待实体图层初始化完成
    await nextTick();

    // 更新地图图层
    updateMap(newValue);

    // 重新加载地名标注
    loadTextPoints(true, false, newValue === 'map002' ? 'map02' : 'map01');

    // 强制刷新一次地图显示
    if (map.value) {
      map.value.updateSize();
      map.value.render();
    }
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
}

#map {
  background-image: url('/assets/map_bg.png');
}

.ol-popup {
  $border-color: rgba(206, 206, 206, 0.5);
  $border-size: 0.2em;

  // 移除以下这行，可能会干扰v-show的功能
  // display: block;

  // 使用更简单的动画过渡，只用scaleY
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: bottom center;

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

  // 简化进入离开过渡效果
  &.v-enter-active,
  &.v-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0 !important; // 使用!important确保优先级
    transform: scaleY(0);
  }
}

.top-bar {
  $height: 0.7rem;
  $clip: polygon(0% 0%, calc(100% - $height) 0%, 100% 100%, 0% 100%);
  height: $height;
  -webkit-clip-path: $clip;
  clip-path: $clip;
  margin-bottom: -0.01em;
}

// .popup-content-container {
//   position: relative;
//   width: 100%;
//   overflow: hidden;
// }

/* 添加聚合点样式 */
.cluster-point {
  transition: transform 0.3s ease;
}

.cluster-point:hover {
  transform: scale(1.1);
}

/* 为所有地图标点添加悬停放大效果 */
.hover-point {
  transition: transform 0.3s ease;
}

.hover-point:hover {
  transform: scale(1.1);
}

/* 为集群容器添加悬停效果 */
.cluster-container .ol-style-icon,
.cluster-container .ol-style-circle {
  transition: transform 0.3s ease;
}

.cluster-container .ol-style-icon:hover,
.cluster-container .ol-style-circle:hover {
  transform: scale(1.1);
}

/* 添加对单点图标的支持 */
.ol-style-icon {
  transition: transform 0.3s ease;
}

.ol-style-icon:hover {
  transform: scale(1.1);
}
</style>
