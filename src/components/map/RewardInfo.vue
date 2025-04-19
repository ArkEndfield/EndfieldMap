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
      id="sub-popup-button-desktop"
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
      id="sub-popup-button-mobile"
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
      <ScrollArea
        content-class="grid grid-cols-2 gap-x-4 gap-y-8 px-6 pt-4 pb-8 w-full h-full"
      >
        <template v-if="rewards && rewards.length > 0">
          <PopContentItem
            v-for="rwd in rewards"
            :key="rwd.id"
          >
            <template #icon>
              <img
                :src="rwd.icon"
                :alt="t(`item.${rwd.id}.name`)"
                class="w-full h-full object-contain"
              />
            </template>
            <template
              #count
              v-if="rwd.count"
              >{{ rwd.count }}</template
            >
            {{ t(`item.${rwd.id}.name`) }}
          </PopContentItem>
        </template>
        <div
          v-else
          class="col-span-2 text-center text-gray-400 py-4"
        >
          暂无奖励信息
        </div>
      </ScrollArea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, watch, onMounted, computed, onUnmounted } from 'vue';
import { PopupManager } from '@/services/PopupManager';
import { type PointData } from '@/types/points';
import { getRewards, shouldShowRewards } from '@/services/reward';
import { type ReturnRewardItem } from '@/types/reward';
import { useI18n } from 'vue-i18n';
import { isMobileDevice, watchDeviceType } from '@/utils/deviceDetection';
import { Ref } from 'vue';

const props = defineProps<{
  entity: PointData | null;
}>();

const popupManager = inject<Ref<PopupManager> | null>('popupManager');
const showRewards = computed(() => {
  return shouldShowRewards(props.entity);
});

const rewards = ref<ReturnRewardItem[]>([]);
const { t } = useI18n();
const isMobile = ref(false);

// 处理移动端子弹窗展开/收起
const toggleMobileSubPopup = () => {
  if (popupManager?.value) {
    // 切换子弹窗状态，正确调用方法
    popupManager?.value.toggleSubPopup();

    // 确保在移动设备上子弹窗能正确折叠
    // if (isMobile.value) {
    //   // 在状态改变后添加适当的延迟，确保位置调整正确进行
    //   setTimeout(() => {
    //     popupManager.adjustPopupPosition();
    //   }, 300);
    // }
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

// 监听 entity 变化以异步加载奖励数据
watch(
  () => props.entity,
  async newEntity => {
    if (newEntity && shouldShowRewards(newEntity)) {
      rewards.value = await getRewards(newEntity);
    } else {
      rewards.value = [];
    }
  }
);

// 当 entity 变化时，如果没有奖励，则关闭背面弹窗
watch(
  () => props.entity,
  newEntity => {
    if (!newEntity || !popupManager) {
      return;
    }

    const hasRewards = shouldShowRewards(newEntity);
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
  { immediate: false } // 避免在 popupManager 初始化前执行
);

// 初始加载
onMounted(async () => {
  if (props.entity && shouldShowRewards(props.entity)) {
    rewards.value = await getRewards(props.entity);
  }
});
</script>
