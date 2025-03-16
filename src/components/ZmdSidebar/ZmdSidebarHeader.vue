<template>
  <div class="zmd-sidebar-header">
    <ZmdSideBarDotLine class="zmd-sidebar-dot-line-left" />
    <ZmdSideBarDotLine class="zmd-sidebar-dot-line-right" />
    <Transition
      @enter="onLinesEnter"
      @leave="onLeave"
    >
      <ZmdSidebarLines v-show="props.open" />
    </Transition>
    <Transition
      @enter="onEnter"
      @leave="onLeave"
    >
      <ZmdSidebarTitleArrow v-show="props.open" />
    </Transition>
    <ZmdSidebarTitle :open="props.open" />
    <ZmdSidebarLocation />
  </div>
</template>

<script setup lang="ts">
import ZmdSideBarDotLine from './header/ZmdSidebarDotLine.vue';
import ZmdSidebarTitleArrow from './header/ZmdSidebarTitleArrow.vue';
import ZmdSidebarLines from './header/ZmdSidebarLines.vue';
import ZmdSidebarTitle from './header/ZmdSidebarTitle.vue';
import ZmdSidebarLocation from './ZmdSidebarLocation.vue';
import { animate, type AnimationPlaybackControls, spring } from 'motion';
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

// 添加组件挂载后的处理
onMounted(async () => {
  if (props.open && isInitialRender.value) {
    await nextTick();

    const animateList: AnimationPlaybackControls[] = [];

    // 获取箭头和线条元素
    const arrowEl = document.querySelector(
      '.zmd-sidebar-title-arrow'
    ) as HTMLElement;
    const linesEl = document.querySelector('.zmd-sidebar-lines') as HTMLElement;

    if (arrowEl) {
      // 设置初始状态
      arrowEl.style.transform = 'translateX(-130%)';

      // 执行箭头动画，无延迟
      animateList.push(
        animate(
          arrowEl,
          { x: '0%' },
          {
            duration: 0.5,
            type: spring,
            bounce: 0.25,
            delay: 0.01,
          }
        )
      );
    }

    if (linesEl) {
      linesEl.style.transform = 'translateX(-130%)';

      animateList.push(
        animate(
          linesEl,
          { x: '0%' },
          { duration: 0.5, type: spring, bounce: 0.4 }
        )
      );
    }

    await Promise.all(animateList);

    isInitialRender.value = false;
  }
});

async function onEnter(el: Element, onComplete: () => void) {
  // 只在非初始渲染时执行动画
  if (!isInitialRender.value) {
    await animate(
      el,
      {
        x: '0%',
      },
      { duration: 0.5, type: spring, bounce: 0.25, delay: 0.01 }
    );
  }
  onComplete();
}

async function onLinesEnter(el: Element, onComplete: () => void) {
  // 只在非初始渲染时执行动画
  if (!isInitialRender.value) {
    await animate(
      el,
      {
        x: '0%',
      },
      { duration: 0.5, type: spring, bounce: 0.4, delay: 0.03 }
    );
  }
  onComplete();
}

async function onLeave(el: Element, onComplete: () => void) {
  await animate(
    el,
    {
      x: '-130%',
    },
    { duration: 0.5, type: spring, bounce: 0.25 }
  );
  onComplete();
}
</script>

<style lang="scss" scoped>
.zmd-sidebar-header {
  margin-top: 1em;
  position: relative;
  * {
    position: relative;
    z-index: 2;
  }
  .zmd-sidebar-dot-line-left {
    position: absolute;
    left: 2em;
    top: 0.8em;
  }
  .zmd-sidebar-dot-line-right {
    position: absolute;
    right: 1.4em;
    top: 2.3em;
  }
  .zmd-sidebar-lines {
    margin-left: 4em;
  }
  .zmd-sidebar-title-arrow {
    position: absolute;
    left: 0;
    top: 1.5em;
    z-index: 1;
  }
  .zmd-sidebar-location {
    position: absolute;
    right: 1.7em;
    bottom: -1em;
    z-index: 2;
    font-size: 1.2em;
  }
}
</style>
