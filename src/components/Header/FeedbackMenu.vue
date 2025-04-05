<template>
  <HeaderMenu v-on:click="onOpen">
    <FeedbackIcon />
    <template #title>{{ $t('header.feedback') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    hide-cancel
  >
    <h1 class="text-lg font-bold text-center">{{ $t('header.feedback') }}</h1>
    <p class="text-center">输入反馈内容</p>
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
