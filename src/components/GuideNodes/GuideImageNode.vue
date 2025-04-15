<template>
  <img
    :src="isBase64 ? props.node.src : `/guides${props.node.src}`"
    :alt="props.node.type"
    class="max-w-full h-auto max-h-32 rounded-lg place-self-center"
    v-viewer
  />
</template>

<script setup lang="ts">
import { type GuideImageNode } from '@/types/guides';
import { computed } from 'vue';

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

const isBase64 = computed(() => props.node.src.startsWith('data:image'));
</script>

<style lang="scss" scoped></style>
