<template>
  <viewer :images="images">
    <GuideNodeNode
      v-for="node in nodes"
      :node="node"
    />
  </viewer>
</template>

<script setup lang="ts">
import { type NodeType } from '@/data/guides';

const props = withDefaults(
  defineProps<{
    nodes: NodeType[];
  }>(),
  {
    nodes: () => [],
  }
);

const images = props.nodes
  .filter(item => item.type === 'node')
  .flatMap(item =>
    item.nodes.filter(node => node.type === 'image').map(node => node.src)
  );
</script>

<style lang="scss" scoped></style>
