<template>
  <div
    class="app-header-left w-18 fixed left-0 top-0 md:bg-gradient-to-r from-black/50 to-black/0 z-20 md:z-[53] h-full flex justify-start gap-8 items-center zmd:side-margin-y text-white px-2 md:px-6"
  >
    <MenuMenu v-on:click="open" />
    <div
      :class="
        cn(
          'fixed left-0 top-0 h-0 bg-black/50 w-full overflow-hidden transition-all duration-300 backdrop-blur-md',
          isShow && 'h-full p-2',
          'md:relative md:flex md:gap-8 md:items-center md:!h-auto md:w-auto md:bg-transparent md:z-0 md:backdrop-blur-none md:transition-none md:duration-0 md:!p-0 md:overflow-visible'
        )
      "
    >
      <div class="md:hidden text-4xl mb-4 p-2">
        <CloseSquareIcon @click="close" />
      </div>
      <GroupMenu />
      <FeedbackMenu />
      <LoginMenu />
      <ChangelogMenu />
      <LanguageMenu />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/tailwind';
import { ref } from 'vue';
const isShow = ref(false);
const open = () => (isShow.value = true);
const close = () => (isShow.value = false);
</script>

<style lang="scss" scoped>
@use '../../styles/zmd.scss' as zmd;
.app-header-left {
  height: zmd.$side-margin-y;
  @media screen and (min-width: zmd.$phone-width) {
    width: zmd.$side-width;
  }
}
</style>
