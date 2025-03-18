<template>
  <div
    :class="
      cn(
        'app-header-left fixed bottom-4 right-4 flex justify-start gap-8 items-center text-white p-1.5 rounded-full z-[56]',
        'md:w-18 md:bottom-[unset] md:right-[unset] md:left-0 md:top-0 md:bg-gradient-to-r md:py-0 md:from-black/50 md:to-black/0 md:px-6 md:rounded-none'
      )
    "
  >
    <div
      class="absolute w-full h-full rounded-full bg-black/20 backdrop-blur-md left-0 top-0 md:hidden"
    ></div>
    <MenuMenu v-on:click="open" />
    <div
      :class="
        cn(
          'fixed right-0 bottom-0 h-0 bg-black/50 w-full overflow-hidden transition-all duration-300 backdrop-blur-md',
          isShow && 'h-full p-2 pt-10',
          'md:relative md:flex md:gap-8 md:items-center md:!h-auto md:w-auto md:bg-transparent md:z-0 md:backdrop-blur-none md:transition-none md:duration-0 md:!p-0 md:overflow-visible'
        )
      "
    >
      <GroupMenu />
      <FeedbackMenu />
      <LoginMenu />
      <ChangelogMenu />
      <LanguageMenu />
      <div
        :class="
          cn(
            'md:hidden text-3xl fixed bottom-3.5 right-3.5 p-2 transition-all duration-300',
            isShow && 'text-5xl'
          )
        "
      >
        <CloseSquareIcon @click="close" />
      </div>
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
  @media screen and (min-width: zmd.$phone-width) {
    height: zmd.$side-margin-y;
    width: zmd.$side-width;
  }
}
</style>
