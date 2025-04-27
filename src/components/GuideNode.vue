<template>
  <viewer :images="images">
    <GuideNodeNode
      v-for="node in nodes"
      :node="node"
    />
  </viewer>
</template>

<script setup lang="ts">
import {
  type NodeType,
  type GuideImageNode,
  type GuideNode,
} from '@/types/guides';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    nodes: NodeType[];
  }>(),
  {
    nodes: () => [],
  }
);

const collectImages = (nodes: (NodeType | GuideNode)[]): string[] => {
  return nodes.flatMap(node => {
    if (node.type === 'node') {
      return collectImages(node.nodes);
    } else if (node.type === 'image') {
      // return [(node as GuideImageNode).src];
      return ["/images/e0m2_3_flashback_008.png"]
    }
    return [];
  });
};

const images = computed(() => collectImages(props.nodes));
</script>

<style lang="scss" scoped></style>
