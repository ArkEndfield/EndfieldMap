<template>
  <div>
    <Popover :class="cn('hidden md:block', props.class)">
      <button class="text-2xl block text-[#D6D6D6]">
        <slot></slot>
      </button>
      <template #popover>
        <slot name="title"></slot>
      </template>
    </Popover>
    <div
      class="flex items-center gap-2 py-2 px-4 border border-gray-200/20 hover:bg-gray-200/20 active:bg-gray-200/20 rounded-full mb-2 md:hidden"
    >
      <div class="text-3xl">
        <slot></slot>
      </div>
      <div class="text-lg">
        <slot name="title"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/tailwind';

const props = defineProps<{
  class?: string;
}>();
</script>

<style lang="scss" scoped></style>
