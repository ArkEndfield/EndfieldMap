<template>
  <ZmdAlert
    v-model:open="open"
    @confirm="showTour"
    @cancel="onCancel"
    confirm-text="show"
  >
    {{ t('tour.show_tip') }}
  </ZmdAlert>
</template>

<script setup lang="ts">
import { LOCAL_STORAGE_KEY } from '@/constants/db_key';
import { onMounted } from 'vue';
import { ref } from 'vue';
import { showTour } from '@/services/tour';
import { useI18n } from 'vue-i18n';
const KEY = LOCAL_STORAGE_KEY.SHOW_TOUR_ALERT;
const open = ref(false);
const { t } = useI18n();
const onCancel = () => {
  localStorage.setItem(KEY, 'true');
};
onMounted(() => {
  const showTourAlert = localStorage.getItem(KEY);
  if (!showTourAlert) {
    open.value = true;
  }
});
</script>

<style lang="scss" scoped></style>
