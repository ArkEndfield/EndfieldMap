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
        <ZmdSidebarObject />
        <ZmdSidebarObject />
        <ZmdSidebarObject />
        <ZmdSidebarObject />
        <ZmdSidebarObject />
      </div>
    </ZmdSidebarItem>
    <ZmdSidebarItem :open="props.open">
      <template #title> 矿物 </template>
      <template #subtitle> MINERAL </template>
    </ZmdSidebarItem>
    <ZmdSidebarItem :open="props.open">
      <template #title> 矿物 </template>
      <template #subtitle> MINERAL </template>
    </ZmdSidebarItem>
    <ZmdSidebarItem :open="props.open">
      <template #title> 矿物 </template>
      <template #subtitle> MINERAL </template>
    </ZmdSidebarItem>
    <ZmdSidebarItem :open="props.open">
      <template #title> 矿物 </template>
      <template #subtitle> MINERAL </template>
    </ZmdSidebarItem>
    <ZmdSidebarItem :open="props.open">
      <template #title> 矿物 </template>
      <template #subtitle> MINERAL </template>
    </ZmdSidebarItem>
  </div>
</template>

<script setup lang="ts">
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
