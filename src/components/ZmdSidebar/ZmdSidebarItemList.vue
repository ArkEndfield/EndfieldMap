<template>
  <div
    class="zmd-sidebar-scroll-list"
    ref="scrollListRef"
  >
    <ZmdSidebarItem
      icon-color="#FFFFFF"
      :open="props.open"
      v-for="(k, i) in categoryInfo"
    >
      <template #title> {{ $t(`sidebar.filter.category.${i}`) }} </template>
      <template #subtitle> {{ i }} </template>
      <div class="objecg-list">
        <ZmdSidebarObject
          v-for="v in k"
          :name="v.name"
          :value="v.count"
          v-model="v.show"
          @change="refresh"
        >
          <img :src="`/assets/${i}/${v.pic}.png`" />
        </ZmdSidebarObject>
      </div>
    </ZmdSidebarItem>
  </div>
</template>

<script setup lang="ts">
import { categoryInfo, refresh } from '@/data/entity';
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
    padding-bottom: 0.4em;
  }
}
</style>
