<template>
  <HeaderMenu v-on:click="onOpen">
    <UserIcon />
    <template #title>{{ $t('header.login') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    hide-cancel
  >
    <h1 class="text-lg font-bold">登录</h1>
    <p>输入账号密码</p>
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
