<template>
  <HeaderMenu v-on:click="onOpen">
    <FeedbackIcon />
    <template #title>{{ t('header.feedback') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    hide-cancel
  >
    <h1 class="text-lg font-bold text-center mb-2">
      {{ t('header.feedback') }}
    </h1>
    <div class="px-4">
      <textarea
        class="resize-none block w-full border-2 p-2 min-h-40 rounded-sm outline-none"
        :placeholder="t('header.feedback')"
      ></textarea>
    </div>
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
