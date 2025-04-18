<template>
  <SettingsItem @end-click="execute">
    {{ t('settings.show_tour.title') }}
    <template #description>
      <div>{{ t('settings.show_tour.tips') }}</div>
    </template>
    <template #before>
      <div><BookIcon /></div>
    </template>
    <template #after>
      <div>
        {{ t('start') }}
      </div>
    </template>
  </SettingsItem>
</template>

<script setup lang="ts">
import { showTour } from '@/services/tour';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const open = defineModel<boolean>('open', {
  required: true,
});
const execute = async () => {
  await showTour();
  open.value = false;
};
</script>

<style scoped></style>
