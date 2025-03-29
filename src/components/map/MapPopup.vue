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
          <div
            class="popup-slider z-1 relative"
            :class="{ 'slide-to-video': showVideoInfo }"
            @transitionend="onTransitionEnd"
          >
            <!-- 基本信息页面 -->
            <div class="popup-page">
              <div class="p-4 pt-2">
                <button
                  class="no-underline absolute top-0 right-5 text-3xl text-[#ece065]"
                  @click="closeToast"
                >
                  <PowerIcon />
                </button>
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
                  <button
                    class="text-[#ece065] text-sm px-3 py-1 bg-black/20 rounded-md hover:bg-black/30 transition-colors"
                    @click="toggleVideoInfo(true)"
                  >
                    {{ $t('popover.video_link') }}
                  </button>
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

            <!-- 视频信息页面 -->
            <div class="popup-page">
              <div class="p-4 pt-2">
                <button
                  class="no-underline absolute top-3 right-5 text-3xl text-[#ece065]"
                  @click="closeToast"
                >
                  <PowerIcon />
                </button>
                <div class="flex items-center mb-3 gap-2">
                  <button
                    class="text-[#ece065] text-sm px-3 py-1 bg-black/20 rounded-md hover:bg-black/30 transition-colors flex items-center"
                    @click="toggleVideoInfo(false)"
                  >
                    <span class="inline-block mr-1">
                      <ForwardLeftIcon />
                    </span>
                    {{ $t('back') }}
                  </button>
                  <div>{{ $t('popover.video_info') }}</div>
                </div>
                <div class="border-b border-[#404140] pb-2 mb-3">
                  <div class="font-bold">
                    {{
                      guides[entity.seq].video.bv || $t('popover.unknow_name')
                    }}
                  </div>
                </div>
                <div class="mb-3">
                  <div class="text-sm text-gray-400">
                    {{ $t('popover.bv') }}
                  </div>
                  <div class="text-[#ece065] mt-1">
                    {{
                      guides[entity.seq].video.bv || $t('popover.unknown_bv')
                    }}
                  </div>
                </div>
                <div class="mb-3">
                  <div class="text-sm text-gray-400">
                    {{ $t('popover.video_link') }}
                  </div>
                  <a
                    :href="`https://www.bilibili.com/video/${
                      guides[entity.seq].video.bv || ''
                    }`"
                    target="_blank"
                    class="text-[#ece065] mt-1 block break-all hover:underline"
                  >
                    https://www.bilibili.com/video/{{
                      guides[entity.seq].video.bv || $t('popover.unknown_bv')
                    }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, nextTick } from 'vue';
import { cn } from '@/utils/tailwind';
import { PopupManager } from './PopupManager';
import { marks } from '@/data/marks';
import { entityInfo } from '@/data/entity';
import { guides } from '@/data/guides';
import { type PointData } from '@/data/points';

const props = defineProps<{
  isPopupVisible: boolean;
  entity: PointData;
  showVideoInfo: boolean;
  openSubPopup: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isPopupVisible', value: boolean): void;
  (e: 'update:showVideoInfo', value: boolean): void;
  (e: 'update:openSubPopup', value: boolean): void;
}>();

const popupContainer = ref<HTMLElement>();
const popupManager = inject('popupManager') as PopupManager | undefined;

// 确保在组件挂载后立即暴露容器元素
onMounted(async () => {
  await nextTick();
  if (popupContainer.value) {
    console.log('Popup container mounted:', popupContainer.value);
  }
});

// 方法委托到PopupManager
const closeToast = () => {
  emit('update:isPopupVisible', false);
  emit('update:showVideoInfo', false);
};

const toggleVideoInfo = (show: boolean) => {
  emit('update:showVideoInfo', show);
};

const toggleSubPopup = () => {
  const newState = !props.openSubPopup;
  console.log('切换副弹窗状态', newState);
  emit('update:openSubPopup', newState);

  // 确保立即更新DOM状态，然后进行视图调整
  requestAnimationFrame(() => {
    if (
      popupManager &&
      typeof popupManager.adjustForExpandedPopup === 'function'
    ) {
      // 等待DOM更新后立即调整一次
      setTimeout(() => {
        popupManager.adjustForExpandedPopup(newState);
      }, 50);

      // 过渡动画完成后的最终调整，确保位置正确
      setTimeout(() => {
        popupManager.adjustForExpandedPopup(newState);
      }, 550);
    }
  });
};

// 动画处理 - 简化为只用scaleY变换
const onEnterPopup = async (el: Element, done: () => void) => {
  console.log('Enter animation started');

  // 如果PopupManager未注入，使用基本动画
  if (!popupManager) {
    el.setAttribute('style', 'opacity: 0; transform: scaleY(0);');
    setTimeout(() => {
      el.setAttribute(
        'style',
        'opacity: 1; transform: scaleY(1); transition: all 0.2s ease;'
      );
      setTimeout(done, 200);
    }, 10);
    return;
  }

  // 使用PopupManager的动画
  try {
    await popupManager.onEnterPopup(el, done);
  } catch (error) {
    console.error('动画出错:', error);
    done(); // 确保回调被调用
  }
};

const onLeavePopup = async (el: Element, done: () => void) => {
  console.log('Leave animation started');
  emit('update:openSubPopup', false); // 关闭子弹窗

  // 如果PopupManager未注入，使用基本动画
  if (!popupManager) {
    el.setAttribute('style', 'opacity: 1; transform: scaleY(1);');
    setTimeout(() => {
      el.setAttribute(
        'style',
        'opacity: 0; transform: scaleY(0); transition: all 0.2s ease;'
      );
      setTimeout(done, 200);
    }, 10);
    return;
  }

  // 使用PopupManager的动画
  try {
    await popupManager.onLeavePopup(el, done);
  } catch (error) {
    console.error('动画出错:', error);
    done(); // 确保回调被调用
  }
};

const onTransitionEnd = (event: TransitionEvent) => {
  popupManager?.onTransitionEnd(event);
};

// 明确暴露容器引用
defineExpose({
  popupContainer,
});
</script>

<style scoped>
/* 简化动画效果，仅使用scaleY */
.v-enter-active,
.v-leave-active {
  transition: all 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: scaleY(0);
}
</style>

<style>
/* 调整副弹窗样式，提供更合理的空间 */
.pop-drop.unfold {
  width: 80%; /* 减少副弹窗宽度，使其更合理 */
  top: 0;
  right: calc(-80% - 0.5em); /* 适应新宽度 */
}
</style>
