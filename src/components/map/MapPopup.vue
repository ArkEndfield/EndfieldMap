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
  >
    <!-- 背面的弹出框 -->
    <div
      class="pop-drop absolute -top-3 w-full -right-4 -z-0 h-full flex flex-col"
      :class="{ unfold: openSubPopup }"
      v-if="showRewards"
    >
      <button
        class="absolute -right-6 top-0 bottom-0 flex flex-col w-6"
        @click="toggleSubPopup"
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
            :class="{ 'rotate-180': openSubPopup }"
          />
        </div>
      </button>
      <div
        class="flex-1 bg-[#272727] flex justify-stretch items-stretch relative overflow-hidden"
      >
        <ScrollArea
          content-class="grid grid-cols-2 gap-x-4 gap-y-8 px-6 py-4 w-full h-full"
        >
          <template v-if="rewards && rewards.length > 0">
            <PopContentItem
              v-for="rwd in rewards"
              :key="rwd.id"
            >
              <template #icon>
                <img
                  :src="rwd.icon"
                  :alt="$t(`item.${rwd.id}.name`)"
                  class="w-full h-full object-contain"
                />
              </template>
              <template
                #count
                v-if="rwd.count"
                >{{ rwd.count }}</template
              >
              {{ $t(`item.${rwd.id}.name`) }}
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
              $t('popover.unknow_name')
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
              {{ $t('popover.video_link') }}
            </a>
            <div class="flex items-center justify-end gap-2 ml-auto">
              <label
                v-if="entity"
                :for="`get-${entity.entityDataIdKey}`"
                class="text-sm"
              >
                {{ $t('popover.obtained') }}
              </label>
              <ZmdSwitch
                v-if="entity"
                :id="`get-${entity?.entityDataIdKey}`"
                v-model:checked="marks[entity.levelLogicId].finish"
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
import { PopupManager } from './PopupManager';
import { marks } from '@/data/marks';
import { entityInfo } from '@/data/entity';
import { getGuide, type GuideInfoDetail } from '@/data/guides';
import { type PointData } from '@/data/points';
import { computed } from 'vue';
import {
  getRewards,
  type ReturnRewardItem,
  shouldShowRewards,
} from '@/data/reward';
import { motion } from 'motion-v';

const props = defineProps<{
  entity: PointData | null;
  openSubPopup: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:openSubPopup', value: boolean): void;
}>();

const popupContainer = ref<HTMLElement>();
const popupManager = inject<PopupManager | null>('popupManager');

const showRewards = computed(() => {
  const entity = props.entity;
  const show = shouldShowRewards(entity);
  return show;
});

const rewards = ref<ReturnRewardItem[]>([]);

const guide = ref<GuideInfoDetail | null>(null);
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

const toggleSubPopup = () => {
  const newState = !props.openSubPopup;
  emit('update:openSubPopup', newState);

  // 清除可能的动画状态，确保不会影响motion动画
  if (popupManager?.resetAnimationState) {
    popupManager.resetAnimationState();
  }

  if (popupManager) {
    popupManager.adjustForExpandedPopup?.(newState);
  }
};

// 监听 entity 的变化，当切换到新的标点时，如果没有奖励，则关闭背面弹窗
watch(
  () => props.entity,
  newEntity => {
    if (!newEntity) {
      return;
    }
    const hasRewards = shouldShowRewards(newEntity);
    if (!hasRewards && props.openSubPopup) {
      // 如果新标点没有奖励，关闭背面弹窗，但不触发视图调整
      emit('update:openSubPopup', false);
      // 重置动画状态
      if (popupManager?.resetAnimationState) {
        popupManager.resetAnimationState();
      }
    }
  },
  { immediate: true }
);

// 添加一个新的 watch 来处理 openSubPopup 的变化
watch(
  () => props.openSubPopup,
  () => {
    // 监听器保留为空，所有位置调整逻辑已移至 OpenLayers.vue 中
    // 这样可以避免两个组件中的位置调整逻辑相互干扰
  }
);

// 明确暴露容器引用
defineExpose({
  popupContainer,
});
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
