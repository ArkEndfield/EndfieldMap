<template>
  <AppHeaderLeft v-show="appLoaded" />
  <ZmdSidebar
    v-show="appLoaded"
    v-if="appLoaded"
  />
  <component :is="currentMapComponent" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

import LeafletComponent from './leaflet.vue';
import OpenLayersComponent from './OpenLayers.vue';

const getQueryParam = (param: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};
const currentMapComponent = ref<null | object>(null);
const appLoaded = ref(false);

// 监听加载完成事件
const handleAppLoadingComplete = () => {
  appLoaded.value = true;
};

onMounted(() => {
  const version = getQueryParam('version');
  currentMapComponent.value =
    version === '1' ? LeafletComponent : OpenLayersComponent;

  // 监听加载完成事件
  window.addEventListener('app-loading-complete', handleAppLoadingComplete);
});

onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener('app-loading-complete', handleAppLoadingComplete);
});
</script>

<style lang="scss" scoped></style>
