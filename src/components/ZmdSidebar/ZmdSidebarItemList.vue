<template>
  <div
    class="zmd-sidebar-scroll-list"
    ref="scrollListRef"
  >
    <ZmdSidebarItem
      icon-color="#FFFFFF"
      :open="props.open"
    >
      <template #title> 收集品 </template>
      <template #subtitle> COLLECTION </template>
      <div class="objecg-list">
        <ZmdSidebarObject
          v-for="k in entityInfo"
          :name="k.name"
          :value="k.count"
          v-model="k.show"
          @change="refresh"
        >
          <img :src="`/assets/${k.point}.png`" />
        </ZmdSidebarObject>
      </div>
    </ZmdSidebarItem>
  </div>
</template>

<script setup lang="ts">
import { entityInfo, refresh } from '@/data/entity';
import ZmdSidebarItem from './ZmdSidebarItem.vue';
import ZmdSidebarObject from './ZmdSidebarObject.vue';

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);
</script>

<style lang="scss" scoped>
.zmd-sidebar-scroll-list {
  margin-top: 0.8em;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: relative;
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
  .objecg-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8em;
  }
}
</style>
