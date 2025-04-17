<template>
  <SettingsItem
    danger
    :loading="loading"
    :error="error"
    :disabled="success"
    @end-click="open = true"
  >
    {{ t('settings.delete_data.title') }}
    <template #description>
      <div>{{ t('settings.delete_data.tips') }}</div>
    </template>
    <template #before>
      <div><TrashIcon /></div>
    </template>
    <template #after>
      <div>
        {{ t('settings.delete_data.title') }}
      </div>
    </template>
  </SettingsItem>
  <ZmdAlert
    v-model:open="open"
    @confirm="execute"
  >
    <div class="text-center mb-4">
      {{ t('settings.delete_data.tips') }}
    </div>
  </ZmdAlert>
  <ZmdAlertFull
    :open="success"
    @confirm="refreshPage"
    @cancel="reset"
  >
    <div>
      {{ t('settings.delete_data.success_tips') }}
    </div>
  </ZmdAlertFull>
</template>

<script setup lang="ts">
import useStateOperate from '@/hooks/useStateOperate';
import { resetSettings } from '@/services/settings';
import { clearStore, StorageType } from '@/utils/indexedDBStorage';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const open = ref(false);
const { loading, error, success, execute, reset } = useStateOperate(
  async () => {
    await clearStore(StorageType.PERMANENT);
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    resetSettings();
  }
);

const refreshPage = () => {
  window.location.reload();
};
</script>

<style scoped></style>
