<template>
  <div
    class="zmd-sidebar-filter"
    ref="filterRef"
  >
    <!-- <ZmdSidebarSwitch>
      <div class="zmd-sidebar-filter-display-name">
        <div class="zmd-sidebar-filter-required">*</div>
        <div class="zmd-sidebar-filter-label">
          {{ $t('sidebar.display_marker_point_name') }}
        </div>
      </div>
    </ZmdSidebarSwitch> -->

    <div class="zmd-sidebar-operate-buttons">
      <ZmdSidebarOperateButton @click="handleClear">
        <template #icon>
          <ZmdSidebarDeleteIcon />
        </template>
        {{ $t('clear_select') }}
        <template #subtitle>CLEAR SELECT</template>
      </ZmdSidebarOperateButton>
      <ZmdSidebarOperateButton @click="handleSelectAll">
        <template #icon>
          <ZmdSidebarCheckboxCheckedIcon />
        </template>
        {{ isSelectAll ? $t('unselect_all') : $t('select_all') }}
        <template #subtitle>{{
          isSelectAll ? 'UNSELECT ALL' : 'SELECT ALL'
        }}</template>
      </ZmdSidebarOperateButton>
    </div>

    <div class="zmd-sidebar-filter-collect-filter">
      <div class="title">{{ $t('sidebar.marker_point_filter') }}</div>
      <div class="list">
        <ZmdSidebarFilterToggle
          :checked="filterCollected === FilterCollected.All"
          @change="setFilterCollected(FilterCollected.All)"
        >
          {{ $t('sidebar.collection.all') }}
        </ZmdSidebarFilterToggle>
        <ZmdSidebarFilterToggle
          :checked="filterCollected === FilterCollected.Collected"
          @change="setFilterCollected(FilterCollected.Collected)"
        >
          {{ $t('sidebar.collection.marked') }}
        </ZmdSidebarFilterToggle>
        <ZmdSidebarFilterToggle
          :checked="filterCollected === FilterCollected.NotCollected"
          @change="setFilterCollected(FilterCollected.NotCollected)"
        >
          {{ $t('sidebar.collection.not_marked') }}
        </ZmdSidebarFilterToggle>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import ZmdSidebarSwitch from './ZmdSidebarSwitch.vue';
import ZmdSidebarOperateButton from './ZmdSidebarOperateButton.vue';
import ZmdSidebarDeleteIcon from './icons/ZmdSidebarDeleteIcon.vue';
import ZmdSidebarCheckboxCheckedIcon from './icons/ZmdSidebarCheckboxCheckedIcon.vue';
import ZmdSidebarFilterToggle from './ZmdSidebarFilterToggle.vue';
import { ref } from 'vue';
import { animate, spring } from 'motion';
import { nextTick } from 'vue';
import { onMounted } from 'vue';
import { selectAll, clear, isSelectAll } from '@/data/entity';

enum FilterCollected {
  All,
  Collected,
  NotCollected,
}
const filterCollected = ref<FilterCollected>(FilterCollected.All);

const setFilterCollected = (collected: FilterCollected) => {
  filterCollected.value = collected;
};

const filterRef = ref<HTMLElement>();

const isInitialRender = ref(true);

// 处理全选按钮点击
const handleSelectAll = () => {
  if (isSelectAll.value) {
    clear();
  } else {
    selectAll();
  }
};

// 处理清除按钮点击
const handleClear = () => {
  clear();
};

onMounted(async () => {
  if (isInitialRender.value) {
    await nextTick();
    const filterEl = filterRef.value;

    if (filterEl) {
      filterEl.style.transform = 'translateX(-130%)';

      await animate(
        filterEl,
        { x: '0%' },
        { duration: 0.5, type: spring, bounce: 0.2, delay: 0.05 }
      );
    }

    isInitialRender.value = false;
  }
});
</script>

<style lang="scss" scoped>
.zmd-sidebar-filter {
  margin: 0 1em;
  z-index: 2;
  .zmd-sidebar-filter-display-name {
    display: flex;
    align-items: center;
    .zmd-sidebar-filter-required {
      color: #898989;
    }
  }

  .zmd-sidebar-operate-buttons {
    display: flex;
    justify-content: center;
    // margin-top: 0.5em;
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
    }
    .list {
      display: flex;
      gap: 0.5em;
      font-size: 0.8em;
      .zmd-sidebar-filter-toggle {
        flex: 1;
      }
    }
  }
}
</style>
