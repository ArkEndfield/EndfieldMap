<template>
  <div>
    <template v-for="item in props.node.nodes">
      <template v-if="item.type === 'node'">
        <GuideNodeNode :node="item" />
      </template>
      <template v-else-if="item.type === 'text'">
        <GuideTextNode :node="item" />
      </template>
      <template v-else-if="item.type === 'image'">
        <GuideImageNode :node="item" />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { NodeType } from '@/types/guides';

const props = withDefaults(
  defineProps<{
    node: NodeType;
  }>(),
  {
    node: () => ({
      type: 'node',
      nodes: [],
    }),
  }
);
</script>

<style lang="scss" scoped></style>
