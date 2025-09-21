<template>
  <SettingsItem>
    <template #icon>
      <ViewAltIcon />
    </template>
    <template #title>
      {{ t('settings.show_electric_pole_range') }}
    </template>
    <template #content>
      <ZmdSwitch
        v-model="showElectricPoleRange"
        @change="handleChange"
      />
    </template>
  </SettingsItem>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsItem from './SettingsItem.vue';
import ZmdSwitch from '@/components/ZmdSwitch.vue';
import settings from '@/data/settings';
import { refreshMap } from '@/services/render';

const { t } = useI18n();

const showElectricPoleRange = computed({
  get: () => settings.value.showElectricPoleRange,
  set: (value: boolean) => {
    settings.value.showElectricPoleRange = value;
  },
});

const handleChange = () => {
  // 刷新地图以更新电线杆样式
  refreshMap();
};
</script>

<style lang="scss" scoped></style>
