<template>
  <img
    :src="isBase64 ? props.node.src : `/guides/images/e0m2_3_flashback_008.png`"
    :alt="props.node.type"
    class="max-w-full h-auto max-h-32 rounded-lg place-self-center"
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
