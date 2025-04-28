<template>
  <div
    v-if="showRewards"
    class="pop-drop absolute -top-3 w-full -right-4 -z-0 h-full flex flex-col"
    :class="{
      'unfold-right': popupManager?.openSubPopup.value && !isMobile,
      'unfold-up': popupManager?.openSubPopup.value && isMobile,
    }"
    style="overflow: visible !important"
  >
    <!-- 桌面端右侧展开按钮 -->
    <button
      v-if="!isMobile"
      id="sub-popup-button"
      class="absolute -right-6 top-0 bottom-0 flex flex-col w-6 z-10"
      @click="popupManager?.toggleSubPopup"
    >
      <div class="w-full flex-shrink-0 flex-grow-0 bg-[#3E3E3E] top-bar"></div>
      <div class="bg-[#3E3E3E] py-1.5">
        <div class="h-1 bg-[#4C4C4C] mr-1"></div>
      </div>
      <div
        class="[writing-mode:vertical-lr] bg-[#3E3E3E] text-[#bfbfbf] font-black pb-6 flex-1 flex items-center justify-center text-2xl"
      >
        <DoubleChevronRight
          class="drop-shadow-[0_0_0.2em_rgba(191,191,191,0.8)] transition-transform"
          :class="{ 'rotate-180': popupManager?.openSubPopup.value }"
        />
      </div>
    </button>

    <!-- 移动端顶部展开按钮 -->
    <button
      v-if="isMobile"
      id="sub-popup-button"
      class="absolute top-[-1.5rem] left-0 right-0 flex flex-row h-6 z-10"
      @click="toggleMobileSubPopup"
    >
      <div class="h-full flex-shrink-0 flex-grow-0 bg-[#3E3E3E] left-bar"></div>
      <div class="bg-[#3E3E3E] px-1.5 flex items-center">
        <div class="w-1 bg-[#4C4C4C] mt-1"></div>
      </div>
      <div
        class="bg-[#3E3E3E] text-[#bfbfbf] font-black pr-6 flex-1 flex items-center justify-center text-2xl"
      >
        <DoubleChevronRight
          class="drop-shadow-[0_0_0.2em_rgba(191,191,191,0.8)] transition-transform -rotate-90"
          :class="{ 'rotate-90': popupManager?.openSubPopup.value }"
        />
      </div>
    </button>
    <div
      class="flex-1 bg-[#272727] flex justify-stretch items-stretch relative overflow-hidden"
    >
      <ScrollArea content-class="px-4 pt-4 pb-8 w-full h-full">
        <ChestReward :point="point" />
        <DungeonReward :point="point" />
      </ScrollArea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, watch, onMounted, computed, onUnmounted } from 'vue';
import { PopupManager } from '@/services/PopupManager';
import { type PointData } from '@/types/points';
import { shouldShowRewards } from '@/services/reward';
import { isMobileDevice, watchDeviceType } from '@/utils/deviceDetection';
import { Ref } from 'vue';

const props = defineProps<{
  point: PointData | null;
}>();

const popupManager = inject<Ref<PopupManager> | null>('popupManager');
const showRewards = computed(() => {
  return shouldShowRewards(props.point);
});

const isMobile = ref(false);

// 处理移动端子弹窗展开/收起
const toggleMobileSubPopup = () => {
  if (popupManager?.value) {
    // 切换子弹窗状态，正确调用方法
    popupManager?.value.toggleSubPopup();
  }
};

// 初始化设备类型检测
onMounted(() => {
  // 初始检测设备类型
  isMobile.value = isMobileDevice();

  // 监听设备类型变化
  const unwatchDevice = watchDeviceType(mobile => {
    isMobile.value = mobile;
  });

  // 组件卸载时移除监听
  onUnmounted(() => {
    unwatchDevice();
  });
});

// 当 point 变化时，如果没有奖励，则关闭背面弹窗
watch(
  () => props.point,
  newPoint => {
    if (!newPoint || !popupManager) {
      return;
    }

    const hasRewards = shouldShowRewards(newPoint);
    // 确保 popupManager 和 openSubPopup 都存在，并且检查 openSubPopup.value
    if (
      !hasRewards &&
      popupManager?.value.openSubPopup &&
      popupManager?.value.openSubPopup.value === true
    ) {
      // 如果新标点没有奖励，关闭背面弹窗，但不触发视图调整
      popupManager?.value.closeSub();
    }
  },
  { immediate: false }
);
</script>
