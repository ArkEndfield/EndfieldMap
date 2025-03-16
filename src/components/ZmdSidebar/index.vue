<template>
  <!-- <div
    class="zmd-sidebar-map-icon"
    @click="openSidebar"
  >
    124
  </div> -->
  <ZmdSidebarOpenArrow @click="openSidebar" />
  <Transition
    @enter="onEnter"
    @leave="onLeave"
  >
    <div
      class="zmd-sidebar"
      v-show="isOpen"
    >
      <div class="zmd-sidebar-bg-start zmd-sidebar-top"></div>
      <div class="zmd-sidebar-bg header-container">
        <ZmdSidebarHeader :open="isOpen" />
        <div
          class="zmd-sidebar-collapse-arrows"
          @click="closeSidebar"
        >
          <span></span>
          <span></span>
        </div>
      </div>
      <div class="zmd-sidebar-bg zmd-sidebar-main">
        <div class="zmd-sidebar-content">
          <Transition
            @enter="onStatusEnter"
            @leave="onLeave"
          >
            <ZmdSidebarFilter v-show="isOpen" />
          </Transition>
          <ZmdSidebarItemList :open="isOpen" />
        </div>
      </div>
      <div class="zmd-sidebar-right-bar"></div>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import ZmdSidebarHeader from './ZmdSidebarHeader.vue';
import ZmdSidebarFilter from './ZmdSidebarFilter.vue';
import ZmdSidebarItemList from './ZmdSidebarItemList.vue';
import { ref, onMounted, nextTick } from 'vue';
import { animate, type AnimationPlaybackControls, spring } from 'motion';
import ZmdSidebarOpenArrow from './ZmdSidebarOpenArrow.vue';

const isOpen = ref(true);
const isInitialRender = ref(true);

// 添加组件挂载后的处理
onMounted(async () => {
  if (isOpen.value && isInitialRender.value) {
    await nextTick();
    const animateList: AnimationPlaybackControls[] = [];
    // 获取侧边栏主容器元素
    const sidebarEl = document.querySelector('.zmd-sidebar') as HTMLElement;
    // 获取需要单独动画的过滤器元素
    const filterEl = document.querySelector(
      '.zmd-sidebar-filter'
    ) as HTMLElement;

    if (sidebarEl) {
      // 设置初始状态
      sidebarEl.style.transform = 'translateX(-130%)';

      // 执行侧边栏主体动画
      animateList.push(
        animate(
          sidebarEl,
          { x: '-4%' },
          { duration: 0.5, type: spring, bounce: 0.25 }
        )
      );
    }

    if (filterEl) {
      // 设置过滤器初始状态
      filterEl.style.transform = 'translateX(-130%)';

      // 执行过滤器动画，无延迟
      animateList.push(
        animate(
          filterEl,
          { x: '0%' },
          { duration: 0.5, type: spring, bounce: 0.2, delay: 0.05 }
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
        x: '-4%',
      },
      { duration: 0.5, type: spring, bounce: 0.25 }
    );
  }
  onComplete();
}

async function onStatusEnter(el: Element, onComplete: () => void) {
  // 只在非初始渲染时执行动画
  if (!isInitialRender.value) {
    await animate(
      el,
      {
        x: '0%',
      },
      { duration: 0.5, type: spring, bounce: 0.2, delay: 0.05 }
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

function closeSidebar() {
  isOpen.value = false;
}

function openSidebar() {
  isOpen.value = true;
}
</script>
<style lang="scss" scoped>
@use '../../styles/zmd.scss' as zmd;
.zmd-sidebar-map-icon {
  position: fixed;
  left: 1em;
  top: zmd.$side-margin-y;
  z-index: 19;
  background: zmd.$side-bg-color-start;
  color: #ececec;
  padding: 0.5em;
  border-radius: 0.5em;
  cursor: pointer;
  font-size: 1.5em;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
  &:hover {
    background: zmd.$side-bg-color-end;
  }
}
.zmd-sidebar {
  position: fixed;
  left: 0;
  transform: translateX(-4%);
  width: zmd.$side-width;
  max-width: 100%;
  top: zmd.$side-margin-y;
  // bottom: zmd.$side-margin-y;
  bottom: 0;
  color: #ececec;
  z-index: 52;
  display: flex;
  overflow: visible !important;
  flex-direction: column;
  height: auto !important;
  @media screen and (max-width: zmd.$phone-width) {
    top: 0;
    bottom: 0 !important;
  }
  * {
    box-sizing: border-box;
    @media screen and (max-width: zmd.$phone-width) {
      cursor: default !important;
    }
  }
  .zmd-sidebar-bg-start {
    background: zmd.$side-bg-color-start;
  }
  .zmd-sidebar-bg {
    background: linear-gradient(
      to bottom,
      zmd.$side-bg-color-start,
      zmd.$side-bg-color-end
    );
  }
  .zmd-sidebar-top {
    $clip: polygon(
      0% 0%,
      calc(100% - zmd.$side-top-height) 0%,
      100% 100%,
      0% 100%
    );
    width: 100%;
    height: zmd.$side-top-height;
    flex-shrink: 0;
    flex-grow: 0;
    border-right: zmd.$side-right-border-size solid
      zmd.$side-right-border-start-color;
    -webkit-clip-path: $clip;
    clip-path: $clip;
  }
  .header-container {
    position: relative;
    padding-left: 0.7em;
    .zmd-sidebar-header {
      flex-shrink: 0;
      flex-grow: 0;
    }
    .zmd-sidebar-collapse-arrows {
      position: absolute;
      right: 1em;
      top: -0.5em;
      display: flex;
      align-items: center;
      cursor: pointer;
      z-index: 2;
      height: 2em;
      width: 2em;
      justify-content: center;
      transition: transform 0.2s;
      transform-origin: right center;
      &:hover {
        transform: scale(1.1);
      }
      &:active {
        transform: scale(0.8);
      }
      span {
        $border: 0.2em solid #ececec;
        width: 0.8em;
        height: 0.8em;
        display: block;
        border-top: $border;
        border-left: $border;
        transform: rotate(-45deg);

        &:first-child {
          margin-right: 0.3em;
          animation: arrowPulse 1.5s infinite;
        }

        &:last-child {
          animation: arrowPulse 1.5s infinite 0.3s;
        }
      }

      @keyframes arrowPulse {
        0% {
          opacity: 0.4;
          transform: rotate(-45deg) translateX(0);
        }
        50% {
          opacity: 1;
          transform: rotate(-45deg) translateX(-0.3em);
        }
        100% {
          opacity: 0.4;
          transform: rotate(-45deg) translateX(0);
        }
      }
    }
  }
  .zmd-sidebar-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-left: 0.7em;
    .zmd-sidebar-content {
      margin-top: 1em;
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding-bottom: 1em;
      .zmd-sidebar-filter {
        flex-shrink: 0;
        flex-grow: 0;
      }
      .zmd-sidebar-scroll-list {
        flex: 1;
      }
    }
  }
  .zmd-sidebar-right-bar {
    position: absolute;
    right: 0;
    top: zmd.$side-top-height;
    bottom: 0;
    width: zmd.$side-right-border-size;
    background: linear-gradient(
      to bottom,
      zmd.$side-right-border-start-color,
      zmd.$side-right-border-end-color
    );
  }
}
</style>
