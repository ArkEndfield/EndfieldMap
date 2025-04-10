<template>
  <SettingsItem
    danger
    :loading="loading"
    :error="error"
    :disabled="success"
    @end-click="open = true"
  >
    {{ $t('settings.delete_data') }}
    <template #description>
      <div>{{ $t('settings.delete_data_tips') }}</div>
    </template>
    <template #before>
      <div><TrashIcon /></div>
    </template>
    <template #after>
      <div v-if="!loading && !error && !success">
        {{ $t('settings.delete_data') }}
      </div>
      <div
        v-else-if="success"
        class="text-xs"
      >
        {{ $t('settings.delete_data_success_tips') }}
        <button
          class="bg-[#272727] text-white rounded px-1 py-0.5 ml-0.5"
          @click="refreshPage"
        >
          {{ $t('refresh') }}
        </button>
      </div>
    </template>
  </SettingsItem>
  <ZmdAlert
    v-model:open="open"
    @confirm="execute"
  >
    <div class="text-center mb-4">
      {{ $t('settings.delete_data_tips') }}
    </div>
  </ZmdAlert>
</template>

<script setup lang="ts">
import useStateOperate from '@/hooks/useStateOperate';
import { clearStore, StorageType } from '@/utils/indexedDBStorage';
import { ref } from 'vue';
const open = ref(false);
const { loading, error, success, execute } = useStateOperate(
  async () => {
    await clearStore(StorageType.PERMANENT);
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  },
  {
    resetTime: 5000,
  }
);

const refreshPage = () => {
  window.location.reload();
};
</script>

<style scoped></style>
