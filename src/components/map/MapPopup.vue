<template>
  <Transition
    @enter="onEnterPopup"
    @leave="onLeavePopup"
  >
    <div
      class="ol-popup absolute bottom-4 -left-[50px] will-change-transform will-change-opacity text-white origin-bottom w-[300px]"
      ref="popupContainer"
      v-show="isPopupVisible"
    >
      <!-- 背面的弹出框 -->
      <div
        class="pop-drop absolute -top-3 w-full -right-4 -z-0 h-full flex flex-col"
        :class="{ unfold: openSubPopup }"
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
          <div
            class="grid grid-cols-2 gap-4 px-6 py-4 w-full h-full overflow-y-auto"
          >
            <PopContentItem>
              <template #icon>
                <img
                  src="/assets/item_read_bag.png"
                  alt=""
                />
              </template>
              <template #count>123</template>
              行动资历
            </PopContentItem>
            <PopContentItem>
              <template #icon></template>
              行动资历
            </PopContentItem>
            <PopContentItem>
              <template #icon></template>
              行动资历
            </PopContentItem>
            <PopContentItem>
              <template #icon></template>
              行动资历
            </PopContentItem>
            <PopContentItem>
              <template #icon></template>
              行动资历
            </PopContentItem>
          </div>
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
          @click="closeToast"
        >
          <PowerIcon />
        </button>
        <div
          class="w-full flex-shrink-0 flex-grow-0 bg-[#272727] top-bar"
        ></div>
        <div
          :class="
            cn(
              'bg-[#272727] popup-content-container overflow-hidden',
              'after:absolute after:-z-0 after:left-0 after:h-32 after:bottom-0 after:w-54 after:bg-gradient-to-tr after:from-white/25 after:via-white/0 after:to-black/0'
            )
          "
        >
          <div
            class="-z-0 absolute -top-12 w-full text-[8rem] font-[Outfit] font-bold text-center text-[rgba(70,70,70,0.4)] tracking-[-0.08em]"
          >
            ZMD
          </div>
          <div
            class="-z-0 absolute top-1/2 -right-0.5 font-[Outfit] font-bold text-center text-[rgba(70,70,70,0.4)] [writing-mode:vertical-lr] transform translate-y-[-50%] text-xs tracking-[0.5em]"
          >
            ZMDMAPS
          </div>
          <div class="p-4 pt-2 z-1 relative">
            <div>
              {{
                entityInfo[entity.entityDataIdKey]?.entityInfo.name ||
                $t('popover.unknow_name')
              }}
            </div>
            <div class="!my-2 !text-sm">
              <span>id: {{ entity.entityDataIdKey }}</span>
              <span class="float-right opacity-75">#{{ entity.seq }}</span>
            </div>
            <GuideNode :nodes="guides[entity.seq].nodes" />
            <div class="border-t border-[#404140] mt-2 pt-2 text-sm mx-1">
              坐标 ({{ entity.position.x }}, {{ entity.position.y }},
              {{ entity.position.z }})
            </div>
            <div class="flex items-center justify-between gap-2 mt-4">
              <a
                :href="guides[entity.seq].video.link"
                target="_blank"
                class="text-[#ece065] text-sm px-3 py-1 bg-black/20 rounded-md hover:bg-black/30 transition-colors"
              >
                {{ $t('popover.video_link') }}
              </a>
              <div class="flex items-center justify-end gap-2">
                <label
                  :for="`get-${entity.entityDataIdKey}`"
                  class="text-sm"
                >
                  {{ $t('popover.obtained') }}
                </label>
                <ZmdSwitch
                  :id="`get-${entity.entityDataIdKey}`"
                  v-model:checked="marks[entity.seq].finish"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import { cn } from '@/utils/tailwind';
import { PopupManager } from './PopupManager';
import { marks } from '@/data/marks';
import { entityInfo } from '@/data/entity';
import { guides } from '@/data/guides';
import { type PointData } from '@/data/points';

const props = defineProps<{
  isPopupVisible: boolean;
  entity: PointData;
  openSubPopup: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isPopupVisible', value: boolean): void;
  (e: 'update:openSubPopup', value: boolean): void;
}>();

const popupContainer = ref<HTMLElement>();
const popupManager = inject<PopupManager | null>('popupManager');

// 方法委托到PopupManager
const closeToast = () => {
  if (popupManager?.closeToast) {
    popupManager.closeToast();
  } else {
    emit('update:isPopupVisible', false);
  }

  // 不要立即清除其他状态，让动画流程完成
};

const toggleSubPopup = () => {
  const newState = !props.openSubPopup;
  emit('update:openSubPopup', newState);

  // 确保立即更新DOM状态，然后进行视图调整
  requestAnimationFrame(() => {
    if (popupManager?.adjustForExpandedPopup) {
      // 重置动画状态，确保调整能正常进行
      popupManager.resetAnimationState?.();

      // 等待DOM更新后立即调整一次
      setTimeout(() => {
        popupManager.adjustForExpandedPopup(newState);
      }, 50);

      // 过渡动画完成后的最终调整，确保位置正确
      setTimeout(() => {
        popupManager.adjustForExpandedPopup(newState);
        // 额外调整，确保在任何情况下都能正确定位
        setTimeout(() => {
          popupManager.adjustPopupPosition?.(true);
        }, 150);
      }, 550);
    }
  });
};

const onEnterPopup = (el: Element, done: () => void) => {
  if (!popupManager) {
    done();
    return;
  }

  // 确保元素在动画开始前可见
  el.setAttribute(
    'style',
    'display: block !important; opacity: 0; transform: scaleY(0);'
  );

  requestAnimationFrame(() => {
    el.setAttribute(
      'style',
      'display: block !important; opacity: 1; transform: scaleY(1); transition: opacity 0.2s ease, transform 0.2s ease;'
    );

    setTimeout(() => {
      el.removeAttribute('style');
      done();
    }, 200);
  });
};

const onLeavePopup = (el: Element, done: () => void) => {
  if (!popupManager) {
    done();
    return;
  }

  // 确保元素在动画开始前可见
  el.setAttribute(
    'style',
    'display: block !important; opacity: 1; transform: scaleY(1);'
  );

  requestAnimationFrame(() => {
    el.setAttribute(
      'style',
      'display: block !important; opacity: 0; transform: scaleY(0); transition: opacity 0.2s ease, transform 0.2s ease;'
    );

    setTimeout(() => {
      el.removeAttribute('style');
      done();
    }, 200);
  });
};

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

  // 过渡效果
  &.v-enter-active,
  &.v-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
    display: block !important;
  }

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
    transform: scaleY(0);
    display: block !important;
  }

  &.v-enter-to,
  &.v-leave-from {
    opacity: 1;
    transform: scaleY(1);
    display: block !important;
  }

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
