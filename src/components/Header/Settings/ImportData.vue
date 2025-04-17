<template>
  <SettingsItem
    :loading="loading"
    :error="error || mergeError || coverError"
    @end-click="execute"
  >
    {{ t('settings.import_data.title') }}
    <template #description>
      <div>{{ t('settings.import_data.tips') }}</div>
    </template>
    <template #before>
      <div><ImportIcon /></div>
    </template>
    <template #after>
      <div v-if="!loading">
        {{ t('settings.import_data.title') }}
      </div>
    </template>
  </SettingsItem>
  <ZmdAlert
    v-model:open="open"
    hide-cancel
    confirm-text="close"
    @confirm="reset"
  >
    <div class="text-center mb-4">
      {{ t('settings.import_data.type_tips') }}
    </div>
    <div class="flex justify-center space-x-4">
      <SquareButton
        :loading="mergeLoading"
        @click="mergeExecute"
      >
        {{ t('merge') }}
      </SquareButton>
      <SquareButton
        :loading="coverLoading"
        @click="coverExecute"
      >
        {{ t('cover') }}
      </SquareButton>
    </div>
  </ZmdAlert>
  <ZmdAlertFull
    :open="mergeSuccess || coverSuccess"
    @confirm="resetAll"
    hide-cancel
  >
    <div>
      {{ t('settings.import_data.success_tips') }}
    </div>
  </ZmdAlertFull>
</template>

<script setup lang="ts">
import useStateOperate from '@/hooks/useStateOperate';
import { isBackupDataValid, mergeData, coverData } from '@/services/data';
import { ref } from 'vue';
import { watch } from 'vue';
import type { BackupData } from '@/types/data';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const open = ref(false);
const chooseFile = (): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', event => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          const content = e.target?.result as string;
          try {
            const data = JSON.parse(content);
            if (!isBackupDataValid(data)) {
              reject(new Error('Invalid data format'));
              return;
            }
            resolve(data);
          } catch (error) {
            reject(new Error('Invalid JSON file'));
          } finally {
            input.remove();
          }
        };
        reader.readAsText(file);
      } else {
        reject(new Error('No file selected'));
        input.remove();
      }
    });
    input.addEventListener('cancel', () => {
      reject(new Error('File selection cancelled'));
      input.remove();
    });
    input.click();
  });
};
// 合并数据
const mergeDataFunc = () => {
  return mergeData(data.value);
};
// 覆盖数据方法
const coverDataFunc = () => {
  return coverData(data.value);
};
const { loading, error, data, success, execute, reset } =
  useStateOperate(chooseFile);
const {
  loading: mergeLoading,
  error: mergeError,
  execute: mergeExecute,
  success: mergeSuccess,
  reset: mergeReset,
} = useStateOperate(mergeDataFunc);
const {
  loading: coverLoading,
  error: coverError,
  execute: coverExecute,
  success: coverSuccess,
  reset: coverReset,
} = useStateOperate(coverDataFunc);
const resetAll = () => {
  reset();
  mergeReset();
  coverReset();
  open.value = false;
};
watch(success, () => {
  if (success.value) open.value = true;
});
watch(open, () => {
  if (!open.value) {
    reset();
  }
});
</script>

<style scoped></style>
