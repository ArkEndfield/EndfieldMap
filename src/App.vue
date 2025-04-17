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
      <OpenLayersComponent v-show="appLoaded" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { updatePoints, getCurrentPoints } from './services/points';
import { loadEntityData, initializeEntity } from './services/entity';
import { loadRewardData } from './services/reward';
import { getCurrentMapId } from './services/MapCore';
import OpenLayersComponent from './OpenLayers.vue';
import AppHeaderLeft from './components/Header/AppHeaderLeft.vue';
import AppHeaderRight from './components/Header/AppHeaderRight.vue';
import ZmdSidebar from './components/ZmdSidebar/index.vue';
import { loadGuidesData } from './services/guides';
import { initMarksData } from './services/marks';
import { loadMaterialData } from './services/material';
import { initializeSettings } from './services/settings';
import { rafTimeout } from './utils/animationTimer';
// const isDev = import.meta.env.MODE === 'development';
// const getQueryParam = (param: string): string | null => {
//   const urlParams = new URLSearchParams(window.location.search);
//   return urlParams.get(param);
// };
// const currentMapComponent = ref<null | object>(null);
const appLoaded = ref(false);

// 在 setup 中添加数据加载逻辑
const isLoading = ref(true);
const loadError = ref<Error | null>(null);

// 加载所有必要的数据
async function loadAllData() {
  try {
    isLoading.value = true;
    loadError.value = null;

    console.log('开始加载所有数据...');
    const mapID = getCurrentMapId();
    // 先加载实体数据
    await loadEntityData();
    console.log('实体数据加载完成');
    await updatePoints(mapID);
    // 加载点位数据 - 使用getCurrentPoints获取预加载的点位
    const points = await getCurrentPoints();

    // 如果没有点位数据，可能是预加载失败，尝试重新加载
    if (!points || points.length === 0) {
      console.log('未找到预加载的点位数据，尝试重新加载...');
      const freshPoints = await updatePoints(mapID);
      console.log('点位数据重新加载完成，加载了', freshPoints.length, '个点位');
    } else {
      console.log('使用预加载的点位数据，共', points.length, '个点位');
    }

    console.log('开始加载奖励数据...');
    // 加载奖励数据
    await loadRewardData();
    console.log('奖励数据加载完成');

    console.log('开始加载攻略数据...');
    // 加载攻略数据
    await loadGuidesData();
    console.log('攻略数据加载完成');

    console.log('开始加载材料数据...');
    await loadMaterialData();
    console.log('材料数据加载完成');

    console.log('开始初始化地图...');
    // 初始化实体信息和地图
    await initializeEntity();
    console.log('地图初始化完成');

    console.log('开始初始化已完成数据...');
    // 确保使用await等待marks数据初始化完成
    await initMarksData();
    console.log('已完成数据初始化完成');

    console.log('开始初始化设置...');
    await initializeSettings();
    console.log('设置初始化完成');

    console.log('所有数据加载完成');
    rafTimeout(() => {
      isLoading.value = false;
    }, 1000);
  } catch (error) {
    console.error('加载数据失败:', error);
    loadError.value = error as Error;
    isLoading.value = false;
  }
}

// 监听加载完成事件
const handleAppLoadingComplete = () => {
  appLoaded.value = true;
};

onMounted(() => {
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
  background-color: rgba(0, 0, 0, 0.8);
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
