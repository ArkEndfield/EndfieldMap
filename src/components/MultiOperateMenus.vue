<template>
  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="isMultiSelecting"
        class="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-full z-[53] overflow-hidden"
        :animate="{
          width: 'auto',
        }"
        :initial="{
          width: 0,
        }"
        :exit="{
          width: 0,
        }"
      >
        <div class="whitespace-nowrap px-2 py-1 flex items-center gap-2">
          <div>{{ t('multi_operate.selected_count', { count: multiSelectMarks.length }) }}</div>
          <motion.div
            class="flex items-center gap-2 overflow-hidden"
            :animate="{
              width: multiSelectMarks.length > 0 ? 'auto' : 0,
            }"
            :initial="{
              width: 0,
            }"
          >
            <button
              class="shrink-0"
              @click="markAsFinished"
            >
              {{ t('popover.obtained') }}
            </button>
            <button
              class="shrink-0"
              @click="markAsUnfinished"
            >
              {{ t('popover.unobtained') }}
            </button>
          </motion.div>
          <button
            class="shrink-0"
            @click="cancelMultiSelect"
          >
            <CloseIcon />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>

    <AnimatePresence>
      <motion.div
        v-if="isInConnectionMode"
        class="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 bg-yellow-400 rounded-full z-[53] overflow-hidden"
        :animate="{
          width: 'auto',
        }"
        :initial="{
          width: 0,
        }"
        :exit="{
          width: 0,
        }"
      >
        <div class="whitespace-nowrap px-2 py-1 flex items-center gap-2 text-black">
          <div>{{ t('multi_operate.electric_pole_connection_mode') }}</div>
          <motion.div class="flex items-center gap-2 overflow-hidden">
            <button
              class="shrink-0 bg-yellow-500 hover:bg-yellow-600 px-2 py-1 rounded text-xs"
              @click="cancelConnectionMode"
            >
              {{ t('multi_operate.exit_connection') }}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  </Teleport>
  <ZmdAlertFull
    v-model:open="isAlertOpen"
    hide-cancel
  >
    {{ t('success') }}
  </ZmdAlertFull>
</template>

<script setup lang="ts">
import { isMultiSelecting, multiSelectMarks } from '@/data/marks';
import {
  cancelMultiSelect,
  finishMultiSelect,
  unfinishMultiSelect,
} from '@/services/marks';
import { isInConnectionMode, endConnectionMode } from '@/services/electricPoleConnector';
import { AnimatePresence, motion } from 'motion-v';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const isAlertOpen = ref(false);
const markAsFinished = () => {
  finishMultiSelect();
  isAlertOpen.value = true;
};
const markAsUnfinished = () => {
  unfinishMultiSelect();
  isAlertOpen.value = true;
};

const cancelConnectionMode = () => {
  endConnectionMode();
};
</script>

<style lang="sass" scoped></style>
