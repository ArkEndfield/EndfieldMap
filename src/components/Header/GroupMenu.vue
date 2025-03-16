<template>
  <HeaderMenu v-on:click="onOpen">
    <ChatIcon />
    <template #title>加入社群</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    hide-cancel
  >
    <h1 class="text-lg font-bold">加入社群</h1>
    <p class="text-sm py-4">扫码加入社群</p>
    <div class="mx-auto w-32 h-32 bg-black"></div>
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
