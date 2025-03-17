<template>
  <HeaderMenu v-on:click="onOpen">
    <ChatIcon />
    <template #title>{{ $t('header.join_community') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    hide-cancel
  >
    <h1 class="text-lg font-bold">{{ $t('header.up') }}</h1>
    <div class="py-4">
      <BilibiliCard />
    </div>
    <h1 class="text-lg font-bold">{{ $t('header.join_community') }}</h1>
    <p class="text-sm py-4">{{ $t('header.community_not_constructed') }}</p>
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
