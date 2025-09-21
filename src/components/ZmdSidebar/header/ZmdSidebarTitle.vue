<template>
  <div class="zmd-sidebar-title">
    <motion.div
      class="zmd-sidebar-title-title"
      :animate="{
        opacity: props.open ? 1 : 0,
        y: props.open ? 0 : -20,
      }"
      :initial="{
        opacity: 0,
        y: -20,
      }"
      :transition="{
        duration: 0.5,
        type: 'spring',
        bounce: 0.25,
        delay: 0.2,
      }"
    >
      <ZmdSidebarTitleBigTitle />
    </motion.div>
    <motion.div
      class="zmd-sidebar-title-subtitle"
      :animate="{
        opacity: props.open ? 1 : 0,
        y: props.open ? 0 : -10,
      }"
      :initial="{
        opacity: 0,
        y: -10,
      }"
      :transition="{
        duration: 0.5,
        type: 'spring',
        bounce: 0.25,
      }"
    >
      <motion.div
        class="zmd-sidebar-title-subtitle-line"
        :animate="{
          width: props.open ? '100%' : '0%',
        }"
        :initial="{
          width: '0%',
        }"
        :transition="{
          duration: 0.5,
          type: 'spring',
          bounce: 0.25,
          delay: 0.2,
        }"
      >
        <span></span>
        <span></span>
        <span></span>
      </motion.div>
      <motion.div
        class="zmd-sidebar-title-subtitle-content"
        :initial="{
          opacity: 0,
          y: -10,
        }"
        :transition="{
          duration: 0.5,
          type: 'spring',
          bounce: 0.25,
          delay: 0.2,
        }"
        :animate="{
          opacity: props.open ? 1 : 0,
          y: props.open ? 0 : -10,
        }"
      >
        {{ t('sidebar.title') }}
        <div class="triangle"></div>
      </motion.div>
    </motion.div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ZmdSidebarTitleBigTitle from '@/components/ZmdSidebar/header/ZmdSidebarTitleBigTitle.vue';
import { motion } from 'motion-v';
const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);
</script>

<style lang="scss" scoped>
.zmd-sidebar-title {
  position: relative;
  user-select: none;
  .zmd-sidebar-title-title {
    position: relative;
    display: flex;
    justify-content: flex-end;
    padding-right: 5em;
  }
  .zmd-sidebar-title-subtitle {
    display: flex;
    flex-direction: column;
    width: fit-content;
    margin-top: -2.6em;
    position: absolute !important;
    right: calc(3rem * 3 + 2.4em);
    .zmd-sidebar-title-subtitle-line {
      display: flex;
      justify-content: start;
      align-items: center;
      height: 0.3em;
      border-top: 0.1em solid #fffefe;
      flex-shrink: 0;
      flex-grow: 0;
      overflow: hidden;
      span {
        height: 100%;
        &:nth-child(1) {
          background-color: #e64de3;
          flex-grow: 3;
        }
        &:nth-child(2) {
          background-color: #f9f957;
          flex-grow: 2.1;
        }
        &:nth-child(3) {
          background-color: #73f6a7;
          flex-grow: 1.2;
        }
      }
    }
    .zmd-sidebar-title-subtitle-content {
      font-size: 1.1em;
      color: #fffefe;
      padding: 0 0.65em;
      background-color: #292929;
      border-bottom: 0.2em solid #393939;
      color: #dadada;
      position: relative;
      white-space: nowrap;
      max-width: 9em;
      .triangle {
        position: absolute;
        width: 0;
        height: 0;
        border-left: 0.2em solid transparent;
        border-right: 0.2em solid transparent;
        border-bottom: 0.2em solid #393939;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1;
      }
      &::before,
      &::after {
        content: '';
        position: absolute;
        width: 0.2em;
        height: 1.1em;
        display: block;
        border: 0.1em solid #7a7a7a;
        bottom: 0.2em;
      }
      &::before {
        border-right: transparent;
        left: 0.3em;
      }
      &::after {
        border-left: transparent;
        right: 0.3em;
      }
    }
  }
}
</style>
