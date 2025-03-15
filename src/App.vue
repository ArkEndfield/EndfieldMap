<template>
  <ZmdSidebar />
  <ZmdAlert
    v-model:open="openAlert"
    v-on:cancel="
      () => {
        return true;
      }
    "
  >
    <p>测试内容</p>
  </ZmdAlert>
  <component :is="currentMapComponent" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import ZmdSidebar from './components/zmd_sidebar/index.vue';
import ZmdAlert from './components/zmd_alert/index.vue';
import LeafletComponent from './leaflet.vue';
import OpenLayersComponent from './OpenLayers.vue';

const openAlert = ref(true);

const getQueryParam = (param: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};
const currentMapComponent = ref<null | object>(null);

onMounted(() => {
  const version = getQueryParam('version');
  currentMapComponent.value =
    version === '1' ? LeafletComponent : OpenLayersComponent;
});
</script>
