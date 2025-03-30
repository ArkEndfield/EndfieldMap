<template>
  <span
    :style="{
      color: props.node.color,
      fontSize: props.node.fontSize,
      fontWeight: props.node.fontWeight,
      fontFamily: props.node.fontFamily,
    }"
    >{{ props.node.text }}</span
  >
</template>

<script setup lang="ts">
import { type GuideTextNode } from '@/data/guides';

const props = withDefaults(
  defineProps<{
    node: GuideTextNode;
  }>(),
  {
    node: () => ({
      type: 'text',
      text: '',
    }),
  }
);
</script>

<style lang="scss" scoped></style>
