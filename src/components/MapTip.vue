<template>
  <div
    class="hidden md:flex fixed bottom-2 right-2 bg-black/60 px-2 py-1 text-sm pointer-events-none rounded-sm text-white gap-2"
  >
    {{ t('dev_tip') }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style lang="scss" scoped></style>
