<template>
  <div :class="['zmd-sidebar-dot-line', $attrs.class]">
    <div class="zmd-sidebar-dot-line-circle"></div>
    <div class="zmd-sidebar-dot-line-lines"></div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@use '../../../styles/zmd.scss' as zmd;
$dot-line-color: #626262;
$dot-line-size: 0.5em;
$dot-line-border-size: 0.1em;
.zmd-sidebar-dot-line {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .zmd-sidebar-dot-line-circle {
    width: $dot-line-size;
    height: $dot-line-size;
    border-radius: 50%;
    border: $dot-line-border-size solid $dot-line-color;
  }
  .zmd-sidebar-dot-line-lines {
    height: 3em;
    width: 0;
    border-right: $dot-line-border-size dashed $dot-line-color;
  }
}
</style>
