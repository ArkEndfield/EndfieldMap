<template>
  <div class="w-full max-w-3xl mx-auto py-4 px-4">
    <div v-if="loading" class="text-center py-4"><div class="spinner"></div></div>
    <div v-else class="space-y-5">
      <div
        v-for="(log, index) in changelog"
        :key="index"
        class="rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md border border-gray-[#292728]"
      >
        <div class="bg-[#292728] text-white py-2 px-4 font-medium text-sm">
          {{ formatLocalizedDate(log.date) }}
          <span v-if="log.endDate">
            - {{ formatLocalizedDate(log.endDate) }}</span
          >
        </div>
        <div class="p-4">
          <ul class="space-y-2">
            <li
              v-for="(change, changeIndex) in log.changes"
              :key="changeIndex"
              class="flex items-start"
            >
              <div
                class="flex-shrink-0 w-2 h-2 rounded-full mt-1.5 mr-3 bg-[#292728]"
              ></div>
              <span class="text-[#292728] text-sm">{{ change }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Changelog } from '@/data/changelog';
import { formatCustomDate } from '@/utils/dateFormatter';

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const changelog = ref<Changelog[]>([]);
const loading = ref(true);

const formatLocalizedDate = (dateStr: string) => {
  const date = new Date(dateStr);

  return formatCustomDate(date, t('date.format.date_only'));
};

onMounted(async () => {
  try {
    const module = await import('@/data/changelog');
    changelog.value = module.default;
  } catch (error) {
    console.error('Failed to load changelog:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #292728;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
