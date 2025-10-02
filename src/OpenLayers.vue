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
      :point="point"
      ref="mapPopupRef"
    />

    <MultiOperateMenus />

    <MapContextMenu ref="mapContextMenuRef" />
    <TourAlert />

    <ZmdAlert
      v-model:open="alertConfig.show"
      hide-cancel
    >
      <div class="text-center" v-if="alertConfig.content">
        {{ alertConfig.useI18n ? t(alertConfig.content) : alertConfig.content }}
      </div>
    </ZmdAlert>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, provide, ref, watch } from 'vue';
import { Map } from 'ol';
import {
  cacheMapId,
  createMap,
  map,
  cleanupMap,
  point,
  zoomLevel,
  popupManager,
} from '@/services/map';
import MapControls from '@/components/map/MapControls.vue';
import MapPopup, { MapPopupRef } from '@/components/map/MapPopup.vue';
import MapContextMenu from '@/components/map/MapContextMenu.vue';
import { useI18n } from 'vue-i18n';
import ZmdAlert from '@/components/ZmdAlert/ZmdAlert.vue';
import { EVENTS, pubsub } from '@/services/pubsub';

const alertConfig = ref({
  show: false,
  useI18n: false,
  content: '',
});

const mapControlsRef = ref();
const mapPopupRef = ref<MapPopupRef>();
const mapContextMenuRef = ref<{ onContextMenu: (event: MouseEvent) => void; closeMenu: () => void } | undefined>();
const { t } = useI18n();

provide('popupManager', popupManager);

const onContextMenu = (event: MouseEvent) => {
  if (mapContextMenuRef.value) {
    mapContextMenuRef.value.onContextMenu(event);
  }
};

onMounted(async () => {
  await createMap(
    cacheMapId.value,
    mapControlsRef.value.controls,
    mapPopupRef.value?.getPopupContainer()
  );

  // 添加地图移动事件监听，关闭菜单
  map.value?.on('movestart', () => {
    mapContextMenuRef.value?.closeMenu();
  });

  // 监听连接尝试开始事件
  pubsub.subscribe(EVENTS.CONNECTION_ATTEMPT_START, () => {
    // 开始新的连接尝试时，隐藏之前的失败弹窗
    alertConfig.value.show = false;
    alertConfig.value.content = '';
  });

  // 监听连接失败事件
  pubsub.subscribe(EVENTS.SHOW_ALERT, (data) => {
    alertConfig.value.content = data.content;
    alertConfig.value.useI18n = !!data.useI18n;
    alertConfig.value.show = true;
  });

  // 监听连接成功事件
  pubsub.subscribe(EVENTS.CONNECTION_SUCCESS, () => {
    // 连接成功时立即隐藏失败弹窗，并清除失败状态
    alertConfig.value.show = false;
    alertConfig.value.content = '';
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
  overflow: hidden;
  /* 防止内容溢出 */
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
