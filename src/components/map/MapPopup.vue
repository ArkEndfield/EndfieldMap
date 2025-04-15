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
    <!-- 背面的弹出框 - 奖励信息 -->
    <RewardInfo :entity="entity" />

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
        <MapPopupDeco />
        <div class="p-4 pt-2 z-1 relative">
          <div>
            {{
              (entity && entityInfo[entity.entityDataIdKey]?.entityInfo.name) ||
              t('popover.unknow_name')
            }}
          </div>
          <div class="!my-2 !text-sm flex flex-wrap items-center gap-2">
            <span class="ml-auto text-zinc-400"
              >id: {{ entity?.levelLogicId }}</span
            >
          </div>
          <CustomPointPopup
            :entity="entity"
            v-if="isCustomPoint"
          />
          <GuideInfo
            :entity="entity"
            v-else
          />
          <div class="flex items-center justify-end gap-2 mt-4">
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
import { inject } from 'vue';
import { cn } from '@/utils/tailwind';
import { PopupManager } from '@/services/PopupManager';
import { marks } from '@/data/marks';
import { entityInfo } from '@/data/entity';
import { type PointData } from '@/types/points';
import { motion, useAnimate } from 'motion-v';
import { useI18n } from 'vue-i18n';
import GuideInfo from './GuideInfo.vue';
import RewardInfo from './RewardInfo.vue';
import { isCustomEntity } from '@/services/entity';
import { computed } from 'vue';

const props = defineProps<{
  entity: PointData | null;
}>();

const popupManager = inject<PopupManager | null>('popupManager');
const [popupContainer] = useAnimate();
const { t } = useI18n();

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

const isCustomPoint = computed(() => {
  return (
    props.entity?.entityDataIdKey &&
    isCustomEntity(props.entity.entityDataIdKey)
  );
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
