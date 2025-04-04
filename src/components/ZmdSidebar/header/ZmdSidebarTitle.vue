<template>
  <div class="zmd-sidebar-title">
    <div
      class="zmd-sidebar-title-title"
      ref="titleTitleRef"
    >
      <ZmdSidebarTitleBigTitle />
    </div>
    <Transition
      @enter="onSubtitleEnter"
      @leave="onSubtitleLeave"
    >
      <div
        class="zmd-sidebar-title-subtitle"
        ref="subTitleRef"
      >
        <Transition
          @enter="onColorLineEnter"
          @leave="onLeave"
        >
          <div
            class="zmd-sidebar-title-subtitle-line"
            v-show="props.open"
            ref="subTitleLineRef"
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </Transition>
        <div class="zmd-sidebar-title-subtitle-content">
          {{ $t('sidebar.title') }}
          <div class="triangle"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { animate, type AnimationPlaybackControls, spring } from 'motion';
import ZmdSidebarTitleBigTitle from './ZmdSidebarTitleBigTitle.vue';
import { ref, onMounted, nextTick } from 'vue';

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);

const isInitialRender = ref(true);
const titleTitleRef = ref<HTMLElement>();
const subTitleRef = ref<HTMLElement>();
const subTitleLineRef = ref<HTMLElement>();
// 添加组件挂载后的初始化动画
onMounted(async () => {
  if (props.open && isInitialRender.value) {
    await nextTick();
    const animateList: AnimationPlaybackControls[] = [];

    // 获取需要动画的元素
    const titleElement = titleTitleRef.value;
    const subtitleElement = subTitleRef.value;
    const lineElement = subTitleLineRef.value;

    if (titleElement) {
      // 设置初始状态
      titleElement.style.opacity = '0';
      titleElement.style.transform = 'translateY(-20px)';

      // 执行标题动画
      animateList.push(
        animate(
          titleElement,
          { opacity: 1, y: 0 },
          { duration: 0.6, type: spring, bounce: 0.3 }
        )
      );
    }

    if (subtitleElement) {
      // 设置初始状态
      subtitleElement.style.opacity = '0';
      subtitleElement.style.transform = 'translateY(-10px)';

      // 执行副标题动画
      animateList.push(
        animate(
          subtitleElement,
          { opacity: 1, y: 0 },
          { duration: 0.5, type: spring, bounce: 0.25, delay: 0.2 }
        )
      );
    }

    if (lineElement) {
      // 设置初始状态
      lineElement.style.width = '0%';

      // 执行副标题下划线动画
      animateList.push(
        animate(
          lineElement,
          { width: '100%' },
          { duration: 0.54, type: spring, bounce: 0.3, delay: 0.4 }
        )
      );
    }

    await Promise.all(animateList);
    isInitialRender.value = false;
  }
});

async function onColorLineEnter(el: Element, onComplete: () => void) {
  // 延迟初始渲染的动画以配合其他元素
  const delay = isInitialRender.value ? 0.4 : 0.1;

  await animate(
    el,
    {
      width: '100%',
    },
    { duration: 0.54, type: spring, bounce: 0.3, delay: delay }
  );
  onComplete();

  // 完成后更新初始渲染状态
  isInitialRender.value = false;
}

async function onLeave(el: Element, onComplete: () => void) {
  await animate(
    el,
    {
      width: '0%',
    },
    { duration: 0.5, type: spring, bounce: 0.25 }
  );
  onComplete();
}

async function onSubtitleEnter(el: Element, onComplete: () => void) {
  // 只在非初始渲染时执行动画
  if (!isInitialRender.value) {
    await animate(
      el,
      {
        opacity: 1,
        y: 0,
      },
      { duration: 0.5, type: spring, bounce: 0.25 }
    );
  }
  onComplete();
}

async function onSubtitleLeave(el: Element, onComplete: () => void) {
  await animate(
    el,
    {
      opacity: 0,
      y: -10,
    },
    { duration: 0.5, type: spring, bounce: 0.25 }
  );
  onComplete();
}
</script>

<style lang="scss" scoped>
.zmd-sidebar-title {
  position: relative;
  .zmd-sidebar-title-title {
    position: relative;
    display: flex;
    justify-content: flex-end;
    padding-right: 5em;
  }
  .zmd-sidebar-title-subtitle {
    display: flex;
    flex-direction: column;
    width: fit-content;
    margin-top: -2.6em;
    position: absolute !important;
    right: calc(3rem * 3 + 2.4em);
    .zmd-sidebar-title-subtitle-line {
      display: flex;
      justify-content: start;
      align-items: center;
      height: 0.3em;
      border-top: 0.1em solid #fffefe;
      flex-shrink: 0;
      flex-grow: 0;
      overflow: hidden;
      span {
        height: 100%;
        &:nth-child(1) {
          background-color: #e64de3;
          flex-grow: 3;
        }
        &:nth-child(2) {
          background-color: #f9f957;
          flex-grow: 2.1;
        }
        &:nth-child(3) {
          background-color: #73f6a7;
          flex-grow: 1.2;
        }
      }
    }
    .zmd-sidebar-title-subtitle-content {
      font-size: 1.1em;
      color: #fffefe;
      padding: 0 0.65em;
      background-color: #292929;
      border-bottom: 0.2em solid #393939;
      color: #dadada;
      position: relative;
      .triangle {
        position: absolute;
        width: 0;
        height: 0;
        border-left: 0.2em solid transparent;
        border-right: 0.2em solid transparent;
        border-bottom: 0.2em solid #393939;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1;
      }
      &::before,
      &::after {
        content: '';
        position: absolute;
        width: 0.2em;
        height: 1.1em;
        display: block;
        border: 0.1em solid #7a7a7a;
        bottom: 0.2em;
      }
      &::before {
        border-right: transparent;
        left: 0.3em;
      }
      &::after {
        border-left: transparent;
        right: 0.3em;
      }
    }
  }
}
</style>
