<template>
  <img
    :src="`/guides${props.node.src}`"
    :alt="props.node.type"
    class="max-w-full h-auto max-h-32 rounded-lg place-self-center"
  />
</template>

<script setup lang="ts">
import { type GuideImageNode } from '@/types/guides';

const props = withDefaults(
  defineProps<{
    node: GuideImageNode;
  }>(),
  {
    node: () => ({
      type: 'image',
      src: '',
    }),
  }
);
</script>

<style lang="scss" scoped></style>
