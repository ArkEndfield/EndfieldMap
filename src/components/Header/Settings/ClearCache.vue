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
      <div v-if="!loading && !error && !success">
        {{ t('settings.clear_cache.title') }}
      </div>
      <div
        v-else-if="success"
        class="text-xs"
      >
        {{ t('settings.clear_cache.success_tips') }}
        <button
          class="bg-[#272727] text-white rounded px-1 py-0.5 ml-0.5"
          @click="refreshPage"
        >
          {{ t('refresh') }}
        </button>
      </div>
    </template>
  </SettingsItem>
</template>

<script setup lang="ts">
import useStateOperate from '@/hooks/useStateOperate';
import { clearJSONCache } from '@/utils/jsonLoader';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const { loading, error, success, execute } = useStateOperate(clearJSONCache, {
  resetTime: 5000,
});

const refreshPage = () => {
  window.location.reload();
};
</script>

<style scoped></style>
