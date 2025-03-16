<template>
  <div class="zmd-sidebar-filter">
    <ZmdSidebarSwitch>
      <div class="zmd-sidebar-filter-display-name">
        <div class="zmd-sidebar-filter-required">*</div>
        <div class="zmd-sidebar-filter-label">显示标点名称</div>
      </div>
    </ZmdSidebarSwitch>

    <div class="zmd-sidebar-operate-buttons">
      <ZmdSidebarOperateButton>
        <template #icon>
          <ZmdSidebarDeleteIcon />
        </template>
        删除
        <template #subtitle>DELETE</template>
      </ZmdSidebarOperateButton>
      <ZmdSidebarOperateButton>
        <template #icon>
          <ZmdSidebarCheckboxCheckedIcon />
        </template>
        全选
        <template #subtitle>SELECT ALL</template>
      </ZmdSidebarOperateButton>
    </div>

    <div class="zmd-sidebar-filter-collect-filter">
      <div class="title">标点显示</div>
      <div class="list">
        <ZmdSidebarFilterToggle>全部</ZmdSidebarFilterToggle>
        <ZmdSidebarFilterToggle>已标记收集</ZmdSidebarFilterToggle>
        <ZmdSidebarFilterToggle>未标记收集</ZmdSidebarFilterToggle>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ZmdSidebarSwitch from './ZmdSidebarSwitch.vue';
import ZmdSidebarOperateButton from './ZmdSidebarOperateButton.vue';
import ZmdSidebarDeleteIcon from './icons/ZmdSidebarDeleteIcon.vue';
import ZmdSidebarCheckboxCheckedIcon from './icons/ZmdSidebarCheckboxCheckedIcon.vue';
import ZmdSidebarFilterToggle from './ZmdSidebarFilterToggle.vue';
</script>

<style lang="scss" scoped>
.zmd-sidebar-filter {
  margin: 0 1em;
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
    margin-top: 0.5em;
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
