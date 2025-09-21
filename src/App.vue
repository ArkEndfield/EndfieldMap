<template>
  <div class="app-container">
    <div
      v-if="isLoading"
      class="loading-overlay"
    >
      <div class="loading-logo"></div>
    </div>
    <div
      v-else-if="loadError"
      class="error-overlay"
    >
      <div class="error-message">
        加载失败，请刷新页面重试
        <div class="error-details">{{ loadError.message }}</div>
      </div>
    </div>
    <template v-else>
      <!-- <Debug v-if="isDev" /> -->
      <AppHeaderLeft v-show="appLoaded" />
      <AppHeaderRight v-show="appLoaded" />
      <ZmdSidebar v-if="appLoaded" />
      <OpenLayersComponent />
      <ZmdSwiper v-if="appLoaded" />
      <MapTip v-if="appLoaded" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, onMounted, onBeforeUnmount } from 'vue';
import OpenLayersComponent from '@/OpenLayers.vue';
import AppHeaderLeft from '@/components/Header/AppHeaderLeft.vue';
import AppHeaderRight from '@/components/Header/AppHeaderRight.vue';
import ZmdSidebar from '@/components/ZmdSidebar/index.vue';
import { isLoading, loadAllData, loadError } from '@/services/init';
// const isDev = import.meta.env.MODE === 'development';
// const getQueryParam = (param: string): string | null => {
//   const urlParams = new URLSearchParams(window.location.search);
//   return urlParams.get(param);
// };
// const currentMapComponent = ref<null | object>(null);
const appLoaded = ref(false);

const { t } = useI18n();
document.title = t('title') || '终末地地图资源查询';


// 监听加载完成事件
const handleAppLoadingComplete = () => {
  appLoaded.value = true;
};

onMounted(async () => {
  // const version = getQueryParam('version');
  // currentMapComponent.value =
  //   version === '1' ? LeafletComponent : OpenLayersComponent;

  // 监听加载完成事件
  window.addEventListener('app-loading-complete', handleAppLoadingComplete);

  // 在组件挂载时加载数据
  loadAllData();
});

onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener('app-loading-complete', handleAppLoadingComplete);
});
</script>

<style lang="scss" scoped>
.app-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.loading-overlay,
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fffdfd;
  z-index: 9999;
  color: white;
}

.loading-logo {
  width: 400px;
  padding-top: 100%;
  max-width: 100%;
  background-image: url('/images/loading_logo.png');
  background-size: 100% auto;
  background-position: center;
  background-repeat: no-repeat;
}

.error-message {
  text-align: center;
  font-size: 1.2rem;
  font-weight: 500;

  .error-details {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #ff6b6b;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
