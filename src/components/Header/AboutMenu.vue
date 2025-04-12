<template>
  <HeaderMenu v-on:click="onOpen">
    <QuestionIcon />
    <template #title>{{ t('header.about') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    hide-cancel
  >
    <h1 class="text-lg font-bold text-center">{{ t('header.up') }}</h1>
    <div class="py-4">
      <BilibiliCard />
    </div>
    <h1 class="text-lg font-bold text-center">{{ t('header.about') }}</h1>
    <p class="text-sm py-4 text-center">
      {{ t('header.community_not_constructed') }}
    </p>
  </ZmdAlert>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const openAlert = ref(false);

const onOpen = () => {
  openAlert.value = true;
};
</script>

<style lang="scss" scoped></style>
