<template>
  <div
    class="app-header-left fixed left-0 top-0 bg-gradient-to-r from-black/50 to-black/0 z-20 h-full flex justify-between items-center zmd:side-margin-y"
  >
    <button>用户</button>
    <button>用户</button>
    <button>用户</button>
    <button>用户</button>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@use '../styles/zmd.scss' as zmd;
.app-header-left {
  width: zmd.$side-width;
  height: zmd.$side-margin-y;
}
</style>
