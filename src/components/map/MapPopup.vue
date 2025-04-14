<template>
  <motion.div
    class="ol-popup absolute bottom-4 -left-[50px] will-change-transform will-change-opacity text-white origin-bottom w-[300px]"
    ref="popupContainer"
    :animate="{
      opacity: popupManager?.isPopupVisible.value ? 1 : 0,
      transform: popupManager?.isPopupVisible.value ? 'scaleY(1)' : 'scaleY(0)',
    }"
    :transition="{
      duration: 0.15,
      type: 'tween',
      ease: 'easeOut',
    }"
    @transitionend="onTransitionEnd"
  >
    <!-- 背面的弹出框 -->
    <div
      class="pop-drop absolute -top-3 w-full -right-4 -z-0 h-full flex flex-col"
      :class="{ unfold: popupManager?.openSubPopup.value }"
      v-if="showRewards"
    >
      <button
        class="absolute -right-6 top-0 bottom-0 flex flex-col w-6"
        @click="popupManager?.toggleSubPopup"
      >
        <div
          class="w-full flex-shrink-0 flex-grow-0 bg-[#3E3E3E] top-bar"
        ></div>
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

    <!-- 前面的弹出框 -->
    <div
      :class="
        cn(
          'pop-content',
          'border-b-6 border-[#656465] relative',
          'before:absolute before:top-full before:border-solid before:border-transparent before:border-t-[#515151] before:border-12 before:left-11.5 before:-ml-2 before:pointer-events-none'
        )
      "
    >
      <button
        class="no-underline absolute top-3 right-5 text-3xl text-[#ece065] z-2"
        @click="popupManager?.closeToast"
      >
        <PowerIcon />
      </button>
      <div class="w-full flex-shrink-0 flex-grow-0 bg-[#272727] top-bar"></div>
      <div
        :class="
          cn(
            'bg-[#272727] popup-content-container overflow-hidden',
            'after:absolute after:-z-0 after:left-0 after:h-32 after:bottom-0 after:w-54 after:bg-gradient-to-tr after:from-white/25 after:via-white/0 after:to-black/0'
          )
        "
      >
        <div
          class="-z-0 absolute -top-12 w-full text-[8rem] font-[Outfit] font-bold text-center text-[rgba(70,70,70,0.4)] tracking-[-0.08em] select-none pointer-events-none"
        >
          ZMD
        </div>
        <div
          class="-z-0 absolute top-1/2 -right-0.5 font-[Outfit] font-bold text-center text-[rgba(70,70,70,0.4)] [writing-mode:vertical-lr] transform translate-y-[-50%] text-xs tracking-[0.5em] select-none pointer-events-none"
        >
          ZMDMAPS
        </div>
        <div class="p-4 pt-2 z-1 relative">
          <div>
            {{
              (entity && entityInfo[entity.entityDataIdKey]?.entityInfo.name) ||
              t('popover.unknow_name')
            }}
          </div>
          <div class="!my-2 !text-sm flex flex-wrap items-center gap-2">
            <span class="ml-auto text-zinc-400"
              >id: #{{ entity?.levelLogicId }}</span
            >
            <!-- <span class="ml-auto">#{{ entity?.levelLogicId }}</span> -->
          </div>
          <div class="min-h-32">
            <GuideNode
              v-if="entity && guide?.nodes"
              :nodes="guide.nodes"
            />
          </div>
          <div class="border-t border-[#404140] mt-2 pt-2 text-sm mx-1">
            坐标 ({{ entity?.position.x }}, {{ entity?.position.y }},
            {{ entity?.position.z }})
          </div>
          <div class="flex items-center gap-2 mt-4">
            <a
              v-if="guide?.video?.link"
              :href="guide.video.link"
              target="_blank"
              class="text-[#ece065] text-sm px-3 py-1 bg-black/20 rounded-md hover:bg-black/30 transition-colors"
            >
              {{ t('popover.video_link') }}
            </a>
            <div class="flex items-center justify-end gap-2 ml-auto">
              <label
                v-if="entity"
                :for="`get-${entity.entityDataIdKey}`"
                class="text-xs"
              >
                {{ t('popover.obtained') }}
              </label>
              <ZmdSwitch
                v-if="entity"
                :id="`get-${entity?.entityDataIdKey}`"
                v-model:checked="marks[entity.levelLogicId].finish"
                border-style="shadow"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
</template>

<script setup lang="ts">
import { ref, inject, watch, onMounted } from 'vue';
import { cn } from '@/utils/tailwind';
import { PopupManager } from '@/services/PopupManager';
import { marks } from '@/data/marks';
import { entityInfo } from '@/data/entity';
import { getGuide } from '@/services/guides';
import { type GuideInfoDetail } from '@/types/guides';
import { type PointData } from '@/types/points';
import { computed } from 'vue';
import { getRewards, shouldShowRewards } from '@/services/reward';
import { type ReturnRewardItem } from '@/types/reward';
import { motion, useAnimate } from 'motion-v';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  entity: PointData | null;
}>();

const popupManager = inject<PopupManager | null>('popupManager');
const showRewards = computed(() => {
  const entity = props.entity;
  const show = shouldShowRewards(entity);
  return show;
});
const [popupContainer] = useAnimate();

const rewards = ref<ReturnRewardItem[]>([]);

const guide = ref<GuideInfoDetail | null>(null);

const { t } = useI18n();

// 当 entity 变化时异步加载奖励数据
onMounted(async () => {
  if (props.entity && shouldShowRewards(props.entity)) {
    const rewardsPromise = getRewards(props.entity);
    const guidePromise = getGuide(props.entity.levelLogicId);
    const [rewardsData, guideData] = await Promise.all([
      rewardsPromise,
      guidePromise,
    ]);
    rewards.value = rewardsData;
    guide.value = guideData;
  }
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

watch(
  () => props.entity,
  async newEntity => {
    if (newEntity) {
      guide.value = await getGuide(newEntity.levelLogicId);
    } else {
      guide.value = null;
    }
  }
);

// 监听 entity 的变化，当切换到新的标点时，如果没有奖励，则关闭背面弹窗
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
      popupManager.openSubPopup &&
      popupManager.openSubPopup.value === true
    ) {
      // 如果新标点没有奖励，关闭背面弹窗，但不触发视图调整
      popupManager.closeSub();
    }
  },
  { immediate: false } // 修改为 false，避免在 popupManager 初始化前执行
);

// 明确暴露容器引用
defineExpose({
  getPopupContainer: () => popupContainer.value,
});

export type MapPopupRef = {
  getPopupContainer: () => HTMLElement | undefined;
};

const onTransitionEnd = (event: TransitionEvent) => {
  // 确保是弹窗本身的过渡动画结束
  if (event.target === popupContainer.value) {
    // 通知 PopupManager 过渡动画已结束
    if (popupManager) {
      popupManager.onTransitionEnd(event);
    }
  }
};
</script>

<style lang="scss">
.ol-popup {
  $border-color: rgba(206, 206, 206, 0.5);
  $border-size: 0.2em;

  // 基本样式
  position: absolute;
  bottom: 1rem;
  left: -50px;
  transform-origin: bottom center;
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  pointer-events: auto;

  // 子弹窗过渡效果
  .pop-drop {
    transition: top 0.3s ease, right 0.3s ease, width 0.3s ease;
    will-change: top, right, width;
    transform-style: preserve-3d;
    backface-visibility: hidden;

    &.unfold {
      width: 80%;
      top: 0;
      right: calc(-80% - 0.5em);
    }
  }

  .pop-content {
    transition: transform 0.2s ease;
    will-change: transform;
    transform-style: preserve-3d;
    backface-visibility: hidden;
    filter: drop-shadow(0 $border-size 0 $border-color)
      drop-shadow(0 calc(0px - $border-size) 0 $border-color)
      drop-shadow($border-size 0 0 $border-color)
      drop-shadow(calc(0px - $border-size) 0 0 $border-color)
      drop-shadow(0 0 0.4em rgba(0, 0, 0, 0.5));
  }
}
</style>
