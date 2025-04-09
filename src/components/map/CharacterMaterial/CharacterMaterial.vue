<template>
  <Teleport
    to="body"
    defer
  >
    <motion.div
      class="character-material-panel fixed left-0 bottom-0 bg-[#272727] z-[53] text-white"
      :animate="{
        opacity: open ? 1 : 0,
        width: open ? 'var(--character-material-panel-width)' : 0,
        overflow: open ? 'visible' : 'hidden',
      }"
      :initial="{
        opacity: 0,
        width: 0,
        overflow: 'hidden',
      }"
      :transition="{
        duration: 0.5,
        type: 'spring',
        bounce: 0.25,
      }"
    >
      <button @click="close">关闭</button>
      123
    </motion.div>
  </Teleport>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';

const open = defineModel<boolean>('open', {
  default: false,
});

const close = () => {
  open.value = false;
};
</script>

<style lang="scss" scoped>
@use '../../../styles/zmd.scss' as zmd;
.character-material-panel {
  --character-material-panel-width: calc(#{zmd.$side-width} - 1.35em);
  width: var(--character-material-panel-width);
  top: calc(#{zmd.$side-margin-y} + 1.05em);
  @media screen and (min-width: zmd.$large-screen-width) {
    --character-material-panel-width: calc(#{zmd.$side-large-width} - 1.35em);
  }
}
</style>
