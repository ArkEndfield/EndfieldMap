<template>
  <div class="relative pt-3">
    <div class="ml-8 flex items-end">
      <div class="relative flex-1 text-[#FDFD59]">
        <div
          class="absolute text-4xl w-fit bottom-0 left-0 text-center bg-clip-text bg-[linear-gradient(-45deg,#FDFD59,#FDFD5900_20.58050117%,#FDFD59_0,#FDFD59_29.41949883%,#FDFD5900_0,#FDFD5900_70.58050117%,#FDFD59_0,#FDFD59_79.41949883%,#FDFD5900_0,#FDFD5900)] bg-repeat text-transparent [background-size:0.1em_0.1em] opacity-50 translate-x-1 font-bold"
        >
          <slot></slot>
        </div>
        <div class="font-bold text-2xl">
          <slot></slot>
        </div>
      </div>
      <button
        class="bg-[#FDFD59] text-[#272727] text-xs font-bold rounded-full px-2 py-0.5 hover:bg-[#FDFD59] active:bg-[#f2f27a] transition-all duration-200 flex items-center gap-1 mb-1"
        @click="toggleContent"
        ref="button"
      >
        <div>{{ showContent ? t('fold') : t('add') }}</div>
        <PlusIcon v-show="!showContent" />
        <MinusIcon v-show="showContent" />
      </button>
    </div>
    <div class="flex h-2 items-stretch">
      <div class="w-8 bg-[#FDFD59]"></div>
      <div
        class="flex-1 bg-[linear-gradient(-45deg,#FDFD59,#FDFD5900_20.58050117%,#FDFD59_0,#FDFD59_29.41949883%,#FDFD5900_0,#FDFD5900_70.58050117%,#FDFD59_0,#FDFD59_79.41949883%,#FDFD5900_0,#FDFD5900)] bg-repeat [background-size:0.2em_0.2em]"
      ></div>
    </div>
    <motion.div
      ref="scope"
      class="relative top-0 left-0 right-0 bg-[#464646] text-[#272727] shadow-md z-10"
      :animate="{
        opacity: showContent ? 1 : 0,
        height: showContent ? '15em' : 0,
        overflow: showContent ? 'visible' : 'hidden',
      }"
      :initial="{
        opacity: 0,
        height: 0,
        overflow: 'hidden',
      }"
      :transition="{
        duration: 0.5,
        type: 'spring',
        bounce: 0.25,
      }"
    >
      <ScrollArea class="p-1">
        <slot name="content"> {{ t('none') }} </slot>
      </ScrollArea>
    </motion.div>
  </div>
</template>

<script setup lang="ts">
import { motion, useAnimate } from 'motion-v';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const showContent = ref(false);
const button = ref<HTMLElement | null>(null);
const [scope] = useAnimate();
const { t } = useI18n();
const toggleContent = () => {
  showContent.value = !showContent.value;
};
</script>

<style lang="scss" scoped></style>
