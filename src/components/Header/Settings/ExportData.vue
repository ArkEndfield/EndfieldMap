<template>
  <SettingsItem
    :loading="loading"
    :error="error"
    :disabled="success"
    @end-click="execute"
  >
    {{ t('settings.export_data.title') }}
    <template #description>
      <div>{{ t('settings.export_data.tips') }}</div>
    </template>
    <template #before>
      <div><ExportIcon /></div>
    </template>
    <template #after>
      <div>
        {{ t('settings.export_data.title') }}
      </div>
    </template>
  </SettingsItem>
  <ZmdAlertFull
    :open="success"
    @confirm="openDownloadLink"
    @cancel="reset"
    confirm-text="download"
  >
    <div>
      {{ t('settings.export_data.success_tips') }}
    </div>
  </ZmdAlertFull>
</template>

<script setup lang="ts">
import { backupData } from '@/services/data';
import useStateOperate from '@/hooks/useStateOperate';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const { loading, error, data, success, execute, reset } = useStateOperate(
  async () => {
    const data = await backupData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    return url;
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
