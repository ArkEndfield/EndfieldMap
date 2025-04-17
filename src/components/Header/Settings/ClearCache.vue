<template>
  <SettingsItem
    @end-click="execute"
    :loading="loading"
    :error="error"
    :disabled="success"
  >
    {{ t('settings.clear_cache.title') }}
    <template #description>
      <div>{{ t('settings.clear_cache.tips') }}</div>
    </template>
    <template #before>
      <div><ClearIcon /></div>
    </template>
    <template #after>
      <div>
        {{ t('settings.clear_cache.title') }}
      </div>
    </template>
  </SettingsItem>
  <ZmdAlertFull
    :open="success"
    @cancel="reset"
    @confirm="refreshPage"
    confirm-text="refresh"
  >
    <div>
      {{ t('settings.clear_cache.success_tips') }}
    </div>
  </ZmdAlertFull>
</template>

<script setup lang="ts">
import useStateOperate from '@/hooks/useStateOperate';
import { clearJSONCache } from '@/utils/jsonLoader';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const { loading, error, success, execute, reset } =
  useStateOperate(clearJSONCache);

const refreshPage = () => {
  window.location.reload();
};
</script>

<style scoped></style>
