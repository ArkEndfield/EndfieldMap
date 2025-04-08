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
      :entity="entity"
      ref="mapPopupRef"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, provide } from 'vue';
import {
  cacheMapId,
  createMap,
  map,
  // cleanupMap,
  entity,
  zoomLevel,
  popupManager,
} from './components/map/MapCore';
import { Map } from 'ol';
import MapControls from './components/map/MapControls.vue';
import MapPopup, { MapPopupRef } from './components/map/MapPopup.vue';
import { ref } from 'vue';

// 引用DOM元素
const mapControlsRef = ref();
const mapPopupRef = ref<MapPopupRef>();

// 提供弹出层管理器给子组件 - 在setup顶层调用provide
provide(
  'popupManager',
  popupManager // 直接提供响应式引用，而非computed
);

onMounted(() => {
  createMap(
    cacheMapId.value,
    mapControlsRef.value.controls,
    mapPopupRef.value?.getPopupContainer()
  );
});

// 组件卸载前执行清理工作
// onBeforeUnmount(() => {
//   console.log('组件卸载，清理资源');

//   // 使用增强的地图清理函数
//   cleanupMap();
// });
</script>

<style lang="scss">
.map-container {
  position: fixed;
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
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

.top-bar {
  $height: 0.7rem;
  $clip: polygon(0% 0%, calc(100% - $height) 0%, 100% 100%, 0% 100%);
  height: $height;
  -webkit-clip-path: $clip;
  clip-path: $clip;
  margin-bottom: -0.01em;
}
</style>
