<template>
  <MapIconButton @click="open" />

  <div
    class="zmd-sidebar-collapse-arrows"
    :style="{
      zIndex: isOpen ? 53 : 2,
    }"
  >
    <Transition
      @enter="onContentEnter"
      @leave="onLeave"
    >
      <ZmdSidebarHeader
        :open="isOpen"
        v-show="isOpen"
      />
    </Transition>

    <Transition
      @enter="onContentEnter"
      @leave="onLeave"
    >
      <ZmdSidebarTitleArrow v-model:open="isOpen" />
    </Transition>
  </div>
  <Transition
    @enter="onEnter"
    @leave="onLeave"
  >
    <div
      class="zmd-sidebar"
      v-show="isOpen"
      ref="sidebarRef"
    >
      <div class="zmd-sidebar-bg-start zmd-sidebar-top"></div>
      <div class="zmd-sidebar-bg zmd-sidebar-main">
        <div class="header-container"></div>
        <div class="zmd-sidebar-content">
          <Transition
            @enter="onStatusEnter"
            @leave="onLeave"
          >
            <ZmdSidebarFilter v-show="isOpen" />
          </Transition>
          <ZmdSidebarItemList :open="isOpen" />
        </div>
        <div class="zmd-sidebar-copyright">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            >黑ICP备2025036958号-1</a
          >
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
import ZmdSidebarTitleArrow from './header/ZmdSidebarTitleArrow.vue';
import { ref, onMounted, nextTick } from 'vue';
import { animate, type AnimationPlaybackControls, spring } from 'motion';

const isOpen = ref(true);
const isInitialRender = ref(true);

const sidebarRef = ref<HTMLElement>();
// 添加组件挂载后的处理
onMounted(async () => {
  if (isOpen.value && isInitialRender.value) {
    await nextTick();
    const animateList: AnimationPlaybackControls[] = [];
    // 获取侧边栏主容器元素
    const sidebarEl = sidebarRef.value;

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

async function onContentEnter(el: Element, onComplete: () => void) {
  // 只在非初始渲染时执行动画
  if (!isInitialRender.value) {
    await animate(
      el,
      {
        x: '0%',
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

const open = () => {
  isOpen.value = true;
};
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
  font-size: 1.5em;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
  &:hover {
    background: zmd.$side-bg-color-end;
  }
}

.zmd-sidebar-collapse-arrows {
  width: calc(zmd.$side-width);
  left: calc(0px - zmd.$side-width * 0.04);
  top: 4.5em;
  z-index: 53;
  position: fixed;
  @media screen and (max-width: zmd.$phone-width) {
    top: 1em;
  }
  .zmd-sidebar-title-arrow {
    position: absolute;
    top: 2.5em;
    z-index: 1;
  }
  .zmd-sidebar-header {
    flex-shrink: 0;
    flex-grow: 0;
    z-index: 2;
    position: relative;
  }
}

.zmd-sidebar {
  position: fixed;
  left: 0;
  transform: translateX(-4%);
  width: zmd.$side-width;
  max-width: 100%;
  top: zmd.$side-margin-y;
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
    z-index: 56;
    height: zmd.$side-header-height;
  }
  .zmd-sidebar-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-left: 0.7em;
    .zmd-sidebar-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      .zmd-sidebar-filter {
        flex-shrink: 0;
        flex-grow: 0;
      }
      .zmd-sidebar-scroll-list {
        flex: 1;
      }
    }
    .zmd-sidebar-copyright {
      flex-shrink: 0;
      flex-grow: 0;
      padding: 0.5em;
      font-size: 0.8em;
      text-align: center;
      color: #b9b9b9;
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
