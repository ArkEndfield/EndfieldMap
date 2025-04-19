<template>
  <SettingsItem @end-click="moveToCenter">
    {{ t('settings.tp_center.title') }}
    <template #description>
      <div>{{ t('settings.tp_center.tips') }}</div>
    </template>
    <template #before>
      <div>
        <CenterIcon />
      </div>
    </template>
    <template #after>
      <div>
        {{ t('settings.tp_center.title') }}
      </div>
    </template>
  </SettingsItem>
</template>

<script setup lang="ts">
import { moveToCenter } from '@/services/MapCore';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<style scoped></style>
