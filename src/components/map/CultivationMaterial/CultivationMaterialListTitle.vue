<template>
  <div>
    <ListTitle :title-font-size="props.titleFontSize" :back-title-font-size="props.backTitleFontSize">
      <slot></slot>
      <template #backTitle>
        <slot></slot>
      </template>
      <template #right>
        <button
          class="bg-[#FDFD59] text-[#272727] text-xs font-bold rounded-full px-2 py-0.5 hover:bg-[#FDFD59] active:bg-[#f2f27a] transition-all duration-200 flex items-center gap-1 mb-1"
          @click="toggleContent"
          ref="button"
        >
          <div>{{ showContent ? t('fold') : t('add') }}</div>
          <PlusIcon v-show="!showContent" />
          <MinusIcon v-show="showContent" />
        </button>
      </template>
    </ListTitle>
    <motion.div
      ref="scope"
      class="relative top-0 left-0 right-0 bg-[#464646] text-[#272727] shadow-md overflow-hidden z-10"
      :animate="{
        opacity: showContent ? 1 : 0,
        height: showContent ? '15em' : 0,
      }"
      :initial="{
        opacity: 0,
        height: 0,
      }"
      :transition="{
        duration: 0.5,
        type: 'spring',
        bounce: 0.25,
      }"
    >
      <ScrollArea
        class="p-1"
        flex-container
      >
        <slot name="content"> {{ t('none') }} </slot>
      </ScrollArea>
    </motion.div>
  </div>
</template>

<script setup lang="ts">
import { motion, useAnimate } from 'motion-v';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ListTitle from '@/components/common/ListTitle.vue';

const props = defineProps<{
  titleFontSize?: string;
  backTitleFontSize?: string;
}>();

const showContent = ref(false);
const button = ref<HTMLElement | null>(null);
const [scope] = useAnimate();
const { t } = useI18n();
const toggleContent = () => {
  showContent.value = !showContent.value;
};
</script>

<style lang="scss" scoped></style>
