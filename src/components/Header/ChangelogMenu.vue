<template>
  <HeaderMenu v-on:click="onOpen">
    <ChangeLogIcon />
    <template #title>{{ $t('header.changelog') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    hide-cancel
    width="800px"
  >
    <h1 class="text-lg font-bold mt-10 text-center sticky top-0 bg-white z-10">
      {{ $t('header.changelog') }}
    </h1>
    <ChangeLog />
  </ZmdAlert>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { formatDate, formatRelativeTime } from '../../utils/dateFormatter';

const openAlert = ref(false);

const onOpen = () => {
  openAlert.value = true;
};

// 可以在这里导出格式化日期的函数，供 ChangeLog 组件使用
defineExpose({
  formatDate,
  formatRelativeTime,
});
</script>

<style lang="scss" scoped></style>
