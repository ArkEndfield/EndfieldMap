<template>
  <div class="map-container">
    <div
      id="map"
      class="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center"
      @contextmenu="onContextMenu"
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

    <ContextMenu
      v-model="menuVisible"
      ref="contextMenuRef"
    >
      <ContextMenuItem
        label="创建标点"
        @click="() => handleAction('create')"
        :disabled="!!rightClickPoint || !rightClickCoordinates"
      >
        <template #icon>
          <LocationClusterIcon />
        </template>
      </ContextMenuItem>
      <ContextMenuItem
        label="删除标点"
        v-show="!!rightClickPoint"
        @click="() => handleAction('delete')"
        className="text-red-500"
      >
        <template #icon>
          <TrashIcon />
        </template>
      </ContextMenuItem>
    </ContextMenu>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, provide } from 'vue';
import {
  cacheMapId,
  createMap,
  map,
  cleanupMap,
  entity,
  zoomLevel,
  popupManager,
  getCurrentMapId,
} from './services/MapCore';
import { Map } from 'ol';
import MapControls from './components/map/MapControls.vue';
import MapPopup, { MapPopupRef } from './components/map/MapPopup.vue';
import { ref } from 'vue';
import { ContextMenuRef } from './components/ContextMenu/type';
import type { Coordinate } from 'ol/coordinate';
import { addMapContextMenuListener } from './services/MapCore';
import {
  createCustomPoint,
  deleteCustomPoint,
  isCustomPoint,
} from './services/customPoints';
import type { PointData } from './types/points';
const menuVisible = ref(false);
const contextMenuRef = ref<ContextMenuRef>();
// 引用DOM元素
const mapControlsRef = ref();
const mapPopupRef = ref<MapPopupRef>();
const rightClickCoordinates = ref<Coordinate>([0, 0]);
const rightClickPoint = ref<PointData | null>(null);

// 提供弹出层管理器给子组件 - 在setup顶层调用provide
provide('popupManager', popupManager);

const onContextMenu = (event: MouseEvent) => {
  if (contextMenuRef.value) {
    contextMenuRef.value.showMenu(event);
  }
};

const handleAction = (action: string) => {
  console.log(`执行操作: ${action}`);
  menuVisible.value = false;
  const currentMap = getCurrentMapId();
  if (action === 'create') {
    createCustomPoint(rightClickCoordinates.value, currentMap);
  } else if (action === 'delete') {
    // 处理删除坐标的逻辑
    if (rightClickPoint.value?.levelLogicId)
      deleteCustomPoint(rightClickPoint.value.levelLogicId);
  }
};

onMounted(async () => {
  await createMap(
    cacheMapId.value,
    mapControlsRef.value.controls,
    mapPopupRef.value?.getPopupContainer()
  );
  addMapContextMenuListener((_, coordinate, point) => {
    rightClickCoordinates.value = coordinate;
    if (point && isCustomPoint(point)) {
      rightClickPoint.value = point;
    } else {
      rightClickPoint.value = null;
    }
  });
});

// 组件卸载前执行清理工作
onBeforeUnmount(() => {
  console.log('组件卸载，清理资源');

  // 使用增强的地图清理函数
  cleanupMap();
});
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
