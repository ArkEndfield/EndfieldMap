<template>
  <div
    class="app-header-left fixed left-0 top-0 bg-gradient-to-r from-black/50 to-black/0 z-20 md:z-[53] h-full flex justify-start gap-8 items-center zmd:side-margin-y text-white px-6"
  >
    <GroupMenu />
    <FeedbackMenu />
    <LoginMenu />
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@use '../../styles/zmd.scss' as zmd;
.app-header-left {
  width: zmd.$side-width;
  height: zmd.$side-margin-y;
}
</style>
