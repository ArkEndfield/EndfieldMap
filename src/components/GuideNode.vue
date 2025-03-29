<template>
  <div
    v-for="(item, i) in props.nodes"
    :key="i"
    class="text-white"
  >
    <template v-if="item.type === 'node'">
      <div
        v-for="(node, j) in item.nodes"
        :key="j"
      >
        <template v-if="node.type === 'text'">
          <span
            :style="{
              color: node.color,
              fontSize: node.fontSize,
              fontWeight: node.fontWeight,
              fontFamily: node.fontFamily,
            }"
            >{{ node.text }}</span
          >
        </template>
        <template v-else-if="node.type === 'image'">
          <img
            :src="node.src"
            :alt="node.type"
            class="max-w-full h-auto max-h-32 rounded-lg place-self-center"
          />
        </template>
      </div>
    </template>
  </div>
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
</script>

<style lang="scss" scoped></style>
