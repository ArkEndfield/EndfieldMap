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
    <ZmdSidebarTitle :open="props.open" />
    <ZmdSidebarLocation rotation-enabled />
  </div>
</template>

<script setup lang="ts">
import ZmdSideBarDotLine from './header/ZmdSidebarDotLine.vue';

import ZmdSidebarLines from './header/ZmdSidebarLines.vue';
import ZmdSidebarTitle from './header/ZmdSidebarTitle.vue';
import ZmdSidebarLocation from './ZmdSidebarLocation.vue';
import { animate, spring } from 'motion';

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);

async function onLinesEnter(el: Element, onComplete: () => void) {
  await animate(
    el,
    {
      x: '0%',
    },
    { duration: 0.5, type: spring, bounce: 0.25, delay: 0.01 }
  );
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
  .zmd-sidebar-location {
    position: absolute;
    right: 1.7em;
    bottom: -1em;
    z-index: 2;
    font-size: 1.2em;
  }
}
</style>
