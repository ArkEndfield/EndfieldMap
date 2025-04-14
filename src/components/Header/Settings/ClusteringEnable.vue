<template>
  <SettingsItem>
    {{ t('settings.clustering_enable.title') }}
    <template #description>
      <div>{{ t('settings.clustering_enable.tips') }}</div>
    </template>
    <template #before>
      <div><LocationClusterIcon /></div>
    </template>
    <template #after>
      <div class="text-xs">
        <ZmdSwitch v-model:checked="settings.isClusteringEnabled" />
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
