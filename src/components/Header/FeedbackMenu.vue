<template>
  <HeaderMenu v-on:click="onOpen">
    <FeedbackIcon />
    <template #title>{{ t('header.feedback') }}</template>
  </HeaderMenu>
  <ZmdAlert v-model:open="openAlert" hide-cancel>
    <h1 class="text-lg font-bold text-center mb-2">
      {{ t('header.feedback') }}
    </h1>
    <div class="px-4">
      <div class="w-full flex justify-center">
        <img src="/images/feedback/qq_group_qr_code.png" alt="qq_group_qr_code" class="w-32" />
      </div>
      <h3 class="text-lg font-bold text-center mb-2">
        请使用微信扫码后填写，或<a class="text-blue-500"
          href="https://doc.weixin.qq.com/smartsheet/form/1_wpnwIrLAAAcKWVEyT5ubQwEKcvi5O1oA_15824f"
          target="_blank">点击连接</a>
      </h3>
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
