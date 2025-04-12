<template>
  <SettingsItem
    :loading="loading"
    :error="error"
    :disabled="success"
    @end-click="execute"
  >
    {{ t('settings.export_data') }}
    <template #description>
      <div>{{ t('settings.export_data_tips') }}</div>
    </template>
    <template #before>
      <div><ExportIcon /></div>
    </template>
    <template #after>
      <div v-if="!loading && !error && !success">
        {{ t('settings.export_data') }}
      </div>
      <div
        v-else-if="success"
        class="text-xs"
      >
        {{ t('settings.export_data_success_tips') }}
        <button
          class="bg-[#272727] text-white rounded px-1 py-0.5 ml-0.5"
          @click="openDownloadLink"
        >
          {{ t('download') }}
        </button>
      </div>
    </template>
  </SettingsItem>
</template>

<script setup lang="ts">
import { backupData } from '@/services/data';
import useStateOperate from '@/hooks/useStateOperate';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const { loading, error, data, success, execute } = useStateOperate(
  async () => {
    const data = backupData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    return url;
  },
  {
    resetTime: 5000,
  }
);

const openDownloadLink = () => {
  if (data.value) {
    const a = document.createElement('a');
    a.href = data.value;
    a.download = 'backup.json';
    a.click();
    a.remove();
    URL.revokeObjectURL(data.value);
  }
};
</script>

<style scoped></style>
