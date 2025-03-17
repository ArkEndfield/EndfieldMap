<template>
  <div class="w-full max-w-3xl mx-auto py-4 px-4">
    <div class="space-y-5">
      <div
        v-for="(log, index) in changelog"
        :key="index"
        class="rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md border border-gray-[#292728]"
      >
        <div class="bg-[#292728] text-white py-2 px-4 font-medium text-sm">
          {{ formatLocalizedDate(log.date) }}
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
import changelog from '@/data/changelog';
import { formatCustomDate } from '@/utils/dateFormatter';

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const formatLocalizedDate = (dateStr: string) => {
  const date = new Date(dateStr);

  return formatCustomDate(date, t('date.format.date_only'));
};
</script>

<style lang="scss" scoped></style>
