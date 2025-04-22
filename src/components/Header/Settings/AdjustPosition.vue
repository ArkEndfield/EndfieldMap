<template>
  <SettingsItem>
    {{ t('settings.adjust_position.title') }}
    <template #description>
      <div>{{ t('settings.adjust_position.tips') }}</div>
    </template>
    <template #before>
      <div><ViewAltIcon /></div>
    </template>
    <template #after>
      <div class="text-xs">
        <ZmdSwitch v-model:checked="settings.adjustPopupPosition" />
      </div>
    </template>
  </SettingsItem>
</template>

<script setup lang="ts">
import settings from '@/data/settings';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<style scoped></style>
