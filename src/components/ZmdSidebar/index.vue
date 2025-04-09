<template>
  <MapIconButton @click="open" />

  <div
    class="zmd-sidebar-collapse-arrows"
    :style="{
      zIndex: isOpen ? 53 : 2,
    }"
  >
    <ZmdSidebarHeader :open="isOpen" />

    <ZmdSidebarTitleArrow v-model:open="isOpen" />
  </div>
  <motion.div
    class="zmd-sidebar"
    :initial="{
      x: '-130%',
    }"
    :animate="{
      x: isOpen ? '-4%' : '-130%',
    }"
    :transition="{
      duration: 0.5,
      type: 'spring',
      bounce: 0.25,
    }"
  >
    <div class="zmd-sidebar-bg-start zmd-sidebar-top"></div>
    <div class="zmd-sidebar-bg zmd-sidebar-main">
      <div class="header-container"></div>
      <div class="zmd-sidebar-content">
        <ZmdSidebarFilter :open="isOpen" />
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
  </motion.div>
</template>
<script setup lang="ts">
import ZmdSidebarHeader from './ZmdSidebarHeader.vue';
import ZmdSidebarFilter from './ZmdSidebarFilter.vue';
import ZmdSidebarItemList from './ZmdSidebarItemList.vue';
import ZmdSidebarTitleArrow from './header/ZmdSidebarTitleArrow.vue';
import { ref } from 'vue';
import { motion } from 'motion-v';

const isOpen = ref(true);

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
  width: zmd.$side-width;
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
  @media (min-width: zmd.$large-screen-width) {
    width: zmd.$side-large-width;
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
