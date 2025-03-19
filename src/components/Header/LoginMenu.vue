<template>
  <HeaderMenu v-on:click="onOpen">
    <UserIcon />
    <template #title>{{ $t('header.login') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    confirm-text="header.login"
    @confirm="onLogin"
  >
    <h1 class="text-lg font-bold">{{ $t('header.login') }}</h1>
    <div class="flex flex-col gap-4 mt-4 w-full px-4">
      <RoundInput
        v-model="username"
        :placeholder="$t('username')"
      >
        <template #icon>
          <UserIcon />
        </template>
      </RoundInput>
      <RoundInput
        v-model="password"
        type="password"
        :placeholder="$t('password')"
      >
        <template #icon>
          <KeyIcon />
        </template>
      </RoundInput>
    </div>
    <div class="text-sm text-[#9B9B9B] my-4">提示信息</div>
  </ZmdAlert>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const username = ref('');
const password = ref('');
const openAlert = ref(false);
const loading = ref(false);

const onOpen = () => {
  openAlert.value = true;
};

const onLogin = async () => {
  console.log(username, password);
  loading.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000));
  // openAlert.value = false;
  loading.value = false;
};
</script>

<style lang="scss" scoped></style>
