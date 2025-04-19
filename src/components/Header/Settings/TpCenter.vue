<template>
  <SettingsItem :loading="loading" :error="error" :disabled="success" @end-click="open = true">
    {{ t('settings.tp_center.title') }}
    <template #description>
      <div>{{ t('settings.tp_center.tips') }}</div>
    </template>
    <template #before>
      <div>
        <TrashIcon />
      </div>
    </template>
    <template #after>
      <div>
        {{ t('settings.tp_center.title') }}
      </div>
    </template>
  </SettingsItem>
  <ZmdAlert v-model:open="open" @confirm="execute">
    <div class="text-center mb-4">
      {{ t('settings.tp_center.tips') }}
    </div>
  </ZmdAlert>
  <ZmdAlertFull :open="success" @confirm="refreshPage" @cancel="reset">
    <div>
      {{ t('settings.tp_center.success_tips') }}
    </div>
  </ZmdAlertFull>
</template>

<script setup lang="ts">
import useStateOperate from '@/hooks/useStateOperate';
import { selectMap } from '@/services/MapCore';
import { removeItem, StorageType } from '@/utils/indexedDBStorage';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const open = ref(false);
const { loading, error, success, execute, reset } = useStateOperate(
  async () => {
    await removeItem('mapViewState_map001', StorageType.PERMANENT);
    await removeItem('mapViewState_map002', StorageType.PERMANENT);
    selectMap(localStorage.getItem('map') || 'map001');
  }
);

const refreshPage = () => {
  window.location.reload();
};
</script>

<style scoped></style>
