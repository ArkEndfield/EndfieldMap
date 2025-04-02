<template>
  <div class="app-container">
    <div
      v-if="isLoading"
      class="loading-overlay"
    >
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
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
      <AppHeaderLeft v-show="appLoaded" />
      <AppHeaderRight v-show="appLoaded" />
      <ZmdSidebar v-if="appLoaded" />
      <!-- <component :is="currentMapComponent" /> -->
      <OpenLayersComponent v-show="appLoaded" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { updatePoints, getCurrentPoints } from './data/points';
import {
  loadEntityData,
  reinitializeEntityLayers,
  initializeMap,
} from './data/entity';
import { loadRewardData } from './data/reward';
import { loadTextPoints } from './data/locations';
import { map, updateMap, cacheMapId } from './components/map/MapCore';
import OpenLayersComponent from './OpenLayers.vue';
import { PopupManager } from './components/map/PopupManager';
import AppHeaderLeft from './components/Header/AppHeaderLeft.vue';
import AppHeaderRight from './components/Header/AppHeaderRight.vue';
import ZmdSidebar from './components/ZmdSidebar/index.vue';
import { initializeGuides } from './data/guides';
import { initMarksData } from './data/marks';

// const getQueryParam = (param: string): string | null => {
//   const urlParams = new URLSearchParams(window.location.search);
//   return urlParams.get(param);
// };
// const currentMapComponent = ref<null | object>(null);
const appLoaded = ref(false);

// 在 setup 中添加数据加载逻辑
const isLoading = ref(true);
const loadError = ref<Error | null>(null);

// 从OpenLayers.vue中导入的状态
const isPopupVisible = ref(false);
const showVideoInfo = ref(false);
const openSubPopup = ref(false);
const popupManager = ref<PopupManager | null>(null);
let overlay: any = null;
let selectInteraction: any = null;

// 加载所有必要的数据
async function loadAllData() {
  try {
    isLoading.value = true;
    loadError.value = null;

    console.log('开始加载所有数据...');

    // 先加载实体数据
    await loadEntityData();
    console.log('实体数据加载完成');

    // 加载点位数据 - 使用getCurrentPoints获取预加载的点位
    const points = await getCurrentPoints();

    // 如果没有点位数据，可能是预加载失败，尝试重新加载
    if (!points || points.length === 0) {
      console.log('未找到预加载的点位数据，尝试重新加载...');
      const freshPoints = await updatePoints();
      console.log('点位数据重新加载完成，加载了', freshPoints.length, '个点位');
    } else {
      console.log('使用预加载的点位数据，共', points.length, '个点位');
    }

    // 加载奖励数据
    await loadRewardData();
    console.log('奖励数据加载完成');

    console.log('开始初始化地图...');
    // 初始化实体信息和地图
    await initializeMap();
    console.log('地图初始化完成');

    console.log('开始初始化已完成数据...');
    // 确保使用await等待marks数据初始化完成
    await initMarksData();
    console.log('已完成数据初始化完成');

    console.log('开始初始化指南数据...');
    // 确保使用await等待指南数据初始化完成
    await initializeGuides();
    console.log('指南数据初始化完成');

    console.log('开始加载地名标注...');
    // 加载地名标注
    loadTextPoints(true, false);
    console.log('地名标注加载完成');

    console.log('所有数据加载完成');
    isLoading.value = false;
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

    // 如果overlay还存在，清除位置
    if (overlay) {
      overlay.setPosition(undefined);
    }

    // 清除选择状态
    if (selectInteraction) {
      selectInteraction.getFeatures().clear();
    }

    try {
      // 重新加载数据
      const points = await updatePoints();
      console.log(`地图切换，加载了 ${points.length} 个点位`);

      // 等待 Vue 更新完成
      await nextTick();

      // 重新初始化实体图层
      await reinitializeEntityLayers();

      // 初始化指南数据 - 异步等待完成
      await initializeGuides();

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
    } catch (error) {
      console.error('切换地图时加载数据失败:', error);
      // 可以在这里添加错误处理UI
    }
  },
  { flush: 'post' } // 确保在 DOM 更新后执行
);
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

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid transparent;
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  font-size: 1.2rem;
  font-weight: 500;
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
