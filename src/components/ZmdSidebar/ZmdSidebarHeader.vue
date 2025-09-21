<template>
  <motion.div
    :initial="{
      x: '-130%',
    }"
    :animate="{
      x: props.open ? '0%' : '-130%',
    }"
    :transition="{
      duration: 0.5,
      type: 'spring',
      bounce: 0.25,
    }"
    class="zmd-sidebar-header"
  >
    <ZmdSideBarDotLine class="zmd-sidebar-dot-line-left" />
    <ZmdSideBarDotLine class="zmd-sidebar-dot-line-right" />
    <ZmdSidebarLines :open="props.open" />
    <ZmdSidebarTitle :open="props.open" />
    <ZmdSidebarLocation rotation-enabled />
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';

import ZmdSideBarDotLine from '@/components/ZmdSidebar/header/ZmdSidebarDotLine.vue';
import ZmdSidebarLines from '@/components/ZmdSidebar/header/ZmdSidebarLines.vue';
import ZmdSidebarTitle from '@/components/ZmdSidebar/header/ZmdSidebarTitle.vue';
import ZmdSidebarLocation from '@/components/ZmdSidebar/ZmdSidebarLocation.vue';

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);
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
