<template>
  <component :is="currentMapComponent" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import LeafletComponent from './leaflet.vue'
import OpenLayersComponent from './OpenLayers.vue'


const getQueryParam = (param: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(param)
}
const currentMapComponent = ref<null | object>(null)

onMounted(() => {
  const version = getQueryParam('version')
  currentMapComponent.value = version === '1' ? LeafletComponent : OpenLayersComponent
})
</script>