<template>
  <HeaderMenu v-on:click="onOpen">
    <CogIcon />
    <template #title>{{ t('header.settings') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    confirm-text="close"
    hide-cancel
    width="40em"
  >
    <h1 class="text-lg font-bold text-center">{{ t('header.settings') }}</h1>
    <div class="flex flex-col gap-4 mt-4 w-full md:px-16">
      <Settings v-model:open="openAlert" />
    </div>
  </ZmdAlert>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const openAlert = ref(false);
const { t } = useI18n();
const onOpen = () => {
  openAlert.value = true;
};
</script>

<style lang="scss" scoped></style>
