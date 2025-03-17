<template>
  <HeaderMenu v-on:click="onOpen">
    <NotificationIcon />
    <template #title>{{ $t('header.changelog') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    hide-cancel
    width="800px"
  >
    <h1 class="text-lg font-bold">更新日志</h1>
    <p>更新日志</p>
  </ZmdAlert>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const openAlert = ref(false);

const onOpen = () => {
  openAlert.value = true;
};
</script>

<style lang="scss" scoped></style>
