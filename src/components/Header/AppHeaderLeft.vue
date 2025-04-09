<template>
  <div
    :class="
      cn(
        'app-header-left fixed bottom-6 right-6 flex justify-start gap-8 items-center text-white p-1.5 rounded-full z-[56]',
        'md:before:absolute md:before:-z-1 md:before:left-0 md:before:top-0 md:before:bottom-0 md:before:w-24 md:before:bg-gradient-to-tr md:before:from-white/25 md:before:via-white/0 md:before:to-black/0',
        'md:after:absolute md:after:-z-1 md:after:left-0 md:after:right-6 md:after:bottom-0 md:after:h-1.5 md:after:bg-gradient-to-r md:after:from-[#FDFA85]/0 md:after:via-[#FDFA85] md:after:to-[#FDFA85]',
        'md:w-full md:items-end md:bottom-[unset] md:right-[unset] md:left-0 md:top-0 md:bg-black/80  md:py-0 md:px-5 md:pb-3.5 md:rounded-none'
      )
    "
  >
    <div class="hidden md:block absolute top-1 left-2">
      <span
        class="absolute w-0.5 h-[0.6rem] -rotate-45 bg-[#FDFA85] origin-bottom-right left-1.5 -top-0.5"
      ></span>
      <span class="absolute w-2 h-0.5 bg-[#FDFA85] left-0 top-2"></span>
      <span class="absolute w-0.5 h-0.5 bg-[#FDFA85] left-1.5 top-0"></span>
    </div>
    <div
      class="absolute w-6.5 h-6.5 rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#222122] backdrop-blur-md shadow-[0_0_0.2em_rgba(253,251,84,0.6)] md:hidden"
      @click="open"
    >
      <div
        class="absolute -top-0.5 -left-0.5 h-2 w-2 border-t-2 border-l-2 border-[#FDFA85]"
      ></div>
      <div
        class="absolute -top-0.5 -right-0.5 h-2 w-2 border-t-2 border-r-2 border-[#FDFA85]"
      ></div>
      <div
        class="absolute -bottom-0.5 -left-0.5 h-2 w-2 border-b-2 border-l-2 border-[#FDFA85]"
      ></div>
      <div
        class="absolute -bottom-0.5 -right-0.5 h-2 w-2 border-b-2 border-r-2 border-[#FDFA85]"
      ></div>
    </div>
    <MenuMenu v-on:click="open" />
    <div
      :class="
        cn(
          'fixed right-0 bottom-0 h-0 bg-black/50 w-full overflow-hidden transition-all duration-300 backdrop-blur-md',
          isShow && 'h-full p-2 pt-10',
          'md:relative md:flex md:gap-10 md:items-center md:!h-auto md:w-auto md:bg-transparent md:z-0 md:backdrop-blur-none md:transition-none md:duration-0 md:!p-0 md:!pb-1 md:!pl-4 md:overflow-visible'
        )
      "
    >
      <FeedbackMenu />
      <ChangelogMenu />
      <LanguageMenu />
      <SettingsMenu />
      <AboutMenu />
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
    <div
      class="hidden md:block absolute bottom-0 right-4 border-[1.5px] border-[#FDFA85] h-2 w-1 border-l-0"
    ></div>
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
    height: calc(zmd.$side-margin-y);
  }
}
</style>
