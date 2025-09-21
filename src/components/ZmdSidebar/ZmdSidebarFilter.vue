<template>
  <motion.div
    class="zmd-sidebar-filter"
    :animate="{
      x: props.open ? '0%' : '-130%',
    }"
    :initial="{
      x: '-130%',
    }"
    :transition="{
      duration: 0.5,
      type: 'spring',
      bounce: 0.25,
    }"
  >
    <div
      class="zmd-sidebar-operate-buttons grid grid-cols-3"
      id="sidebar-operate-buttons"
    >
      <ZmdSidebarOperateButton @click="handleClear">
        <template #icon>
          <ZmdSidebarDeleteIcon />
        </template>
        {{ t('clear_select') }}
        <template #subtitle>CLEAR SELECT</template>
      </ZmdSidebarOperateButton>
      <ZmdSidebarOperateButton @click="toggleMultiSelectState">
        <template #icon>
          <ZmdSidebarCheckboxCheckedIcon />
        </template>
        {{
          isMultiSelecting
            ? t('sidebar.filter.cancel_multi_operate')
            : t('sidebar.filter.multi_operate')
        }}
        <template #subtitle>{{
          isMultiSelecting ? 'CANCEL OPERATE' : 'MULTI OPERATE'
        }}</template>
      </ZmdSidebarOperateButton>
      <ZmdSidebarOperateButton
        @click="toggleCultivationMaterial"
        id="character-filter"
      >
        <template #icon>
          <img
            src="/images/icon_character.png"
            alt=""
            class="opacity-40"
          />
        </template>
        {{ t('sidebar.filter.cultivation_material') }}
        <template #subtitle>Cultivation MATERIAL</template>
      </ZmdSidebarOperateButton>
    </div>

    <div
      class="zmd-sidebar-filter-collect-filter"
      id="mark-filter-buttons"
    >
      <div class="title">{{ t('sidebar.marker_point_filter') }}</div>
      <div class="list">
        <ZmdSidebarFilterToggle
          :checked="currentMarkFilter === 'all'"
          @change="setMarkFilter('all')"
        >
          {{ t('sidebar.collection.all') }}
        </ZmdSidebarFilterToggle>
        <ZmdSidebarFilterToggle
          :checked="currentMarkFilter === 'marked'"
          @change="setMarkFilter('marked')"
        >
          {{ t('sidebar.collection.marked') }}
        </ZmdSidebarFilterToggle>
        <ZmdSidebarFilterToggle
          :checked="currentMarkFilter === 'unmarked'"
          @change="setMarkFilter('unmarked')"
        >
          {{ t('sidebar.collection.not_marked') }}
        </ZmdSidebarFilterToggle>
      </div>
    </div>

    <!-- 电线杆范围显示开关 -->
    <div
      class="zmd-sidebar-filter-collect-filter flex flex-row items-center gap-2"
      id="electric-pole-range-toggle"
    >
      <div class="title !mb-0">{{ t('sidebar.filter.electric_pole_range') }}</div>
      <div class="list">
        <ZmdSwitch
          :checked="showElectricPoleRange"
          @change="toggleElectricPoleRange"
        />
      </div>
    </div>
  </motion.div>
  <CultivationMaterial />
</template>

<script setup lang="ts">
import ZmdSidebarOperateButton from './ZmdSidebarOperateButton.vue';
import ZmdSidebarDeleteIcon from './icons/ZmdSidebarDeleteIcon.vue';
import ZmdSidebarCheckboxCheckedIcon from './icons/ZmdSidebarCheckboxCheckedIcon.vue';
import ZmdSidebarFilterToggle from './ZmdSidebarFilterToggle.vue';
import { showCultivationMaterial } from '@/data/entity';
import { clear } from '@/services/entity';
import { currentMarkFilter, isMultiSelecting } from '@/data/marks';
import { setMarkFilter, toggleMultiSelectState } from '@/services/marks';
import settings from '@/data/settings';
import { electricPoleRangeLayer } from '@/services/render/store';
import { motion } from 'motion-v';
import { watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getCurrentPoints } from '@/services/points';
import { populateFeaturesFromPoints } from '@/services/render/markers';
const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);

const toggleCultivationMaterial = () => {
  showCultivationMaterial.value = !showCultivationMaterial.value;
};

watch(
  () => props.open,
  newVal => {
    if (!newVal) {
      showCultivationMaterial.value = false;
    }
  }
);

// 处理清除按钮点击
const handleClear = () => {
  clear();
};

// 电线杆范围显示开关
const showElectricPoleRange = computed({
  get: () => settings.value.showElectricPoleRange,
  set: (value: boolean) => {
    settings.value.showElectricPoleRange = value;
  },
});

const toggleElectricPoleRange = () => {
  showElectricPoleRange.value = !showElectricPoleRange.value;

  // 切换电线杆范围层的可见性
  if (electricPoleRangeLayer) {
    electricPoleRangeLayer.setVisible(showElectricPoleRange.value);

    // 重新填充所有Feature，确保范围Feature被正确创建或删除
    getCurrentPoints().then(points => {
      populateFeaturesFromPoints(points);
    });
  }
};
</script>

<style lang="scss" scoped>
.zmd-sidebar-filter {
  margin: 0 1em;
  z-index: 2;
  user-select: none;
  .zmd-sidebar-filter-display-name {
    display: flex;
    align-items: center;
    .zmd-sidebar-filter-required {
      color: #898989;
    }
  }

  .zmd-sidebar-operate-buttons {
    font-size: 0.9em;
  }

  .zmd-sidebar-filter-collect-filter {
    margin-top: 0.5em;
    position: relative;
    padding-left: 0.6em;
    &::before {
      content: '';
      display: block;
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      width: 0.3em;
      height: 90%;
      background: #2d2d2d;
      flex-grow: 0;
      flex-shrink: 0;
    }
    .title {
      margin-bottom: 0.2em;
      font-size: 0.9em;
    }
    .list {
      display: flex;
      gap: 0.5em;
      font-size: 0.8em;
      .zmd-sidebar-filter-toggle {
        flex: 1;

        &.single-toggle {
          flex: none;
          width: 100%;
          max-width: 200px;
        }
      }
    }
  }
}
</style>
