<template>
  <SettingsItem
    :loading="loading"
    :error="error"
    @end-click="execute"
  >
    {{ t('settings.import_data') }}
    <template #description>
      <div>{{ t('settings.import_data_tips') }}</div>
    </template>
    <template #before>
      <div><ImportIcon /></div>
    </template>
    <template #after>
      <div v-if="!loading">
        {{ t('settings.import_data') }}
      </div>
    </template>
  </SettingsItem>
  <ZmdAlert
    v-model:open="open"
    hide-cancel
    confirm-text="close"
  >
    <div class="text-center mb-4">
      {{ t('settings.import_data_type_tips') }}
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
    <div
      v-if="mergeError || coverError"
      class="text-red-500 text-center mt-4"
    >
      {{ t('settings.import_data_failed_tips') }}
    </div>
    <div
      v-if="mergeError"
      class="text-red-500 text-center"
    >
      {{ mergeError }}
    </div>
    <div
      v-if="coverError"
      class="text-red-500 text-center"
    >
      {{ coverError }}
    </div>
    <div
      v-if="mergeSuccess || coverSuccess"
      class="text-green-500 text-center mt-4"
    >
      {{ t('settings.import_data_success_tips') }}
    </div>
  </ZmdAlert>
</template>

<script setup lang="ts">
import useStateOperate from '@/hooks/useStateOperate';
import { isBackupDataValid, mergeData, coverData } from '@/services/data';
import { ref } from 'vue';
import { watch } from 'vue';
import { rafTimeout } from '@/utils/animationTimer';
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
              reject('Invalid data format');
              return;
            }
            resolve(data);
          } catch (error) {
            reject('Invalid JSON file');
          } finally {
            input.remove();
          }
        };
        reader.readAsText(file);
      } else {
        reject('No file selected');
        input.remove();
      }
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
} = useStateOperate(mergeDataFunc, {
  resetTime: 5000,
});
const {
  loading: coverLoading,
  error: coverError,
  execute: coverExecute,
  success: coverSuccess,
} = useStateOperate(coverDataFunc, {
  resetTime: 5000,
});
watch(success, () => {
  if (success.value) open.value = true;
});
watch(open, () => {
  if (!open.value) {
    reset();
  }
});
// 如果成功（任一），则过五秒钟后关闭
watch(
  () => mergeSuccess.value || coverSuccess.value,
  () => {
    if (mergeSuccess.value || coverSuccess.value) {
      rafTimeout(() => {
        open.value = false;
      }, 1000);
    }
  }
);
</script>

<style scoped></style>
