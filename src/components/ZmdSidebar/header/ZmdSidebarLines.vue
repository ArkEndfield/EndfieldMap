<template>
  <motion.div
    class="zmd-sidebar-lines"
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
    <div class="zmd-sidebar-line">
      <motion.span
        v-for="(item, index) of lineSpecs[0]"
        :key="index"
        :style="{ width: item.width, marginRight: item.margin || '0' }"
        :animate="{
          backgroundColor: ['#737474', '#a0a0a0', '#737474'],
          opacity: [0.7, 1, 0.7],
        }"
        :transition="{
          duration: item.duration,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: item.delay,
        }"
      >
      </motion.span>
    </div>
    <div class="zmd-sidebar-line">
      <motion.span
        v-for="(item, index) of lineSpecs[1]"
        :key="index"
        :style="{ width: item.width, marginRight: item.margin || '0' }"
        :animate="{
          backgroundColor: ['#737474', '#a0a0a0', '#737474'],
          opacity: [0.7, 1, 0.7],
        }"
        :transition="{
          duration: item.duration,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: item.delay,
        }"
      >
      </motion.span>
    </div>
    <div class="zmd-sidebar-line">
      <motion.span
        v-for="(item, index) of lineSpecs[2]"
        :key="index"
        :style="{ width: item.width, marginRight: item.margin || '0' }"
        :animate="{
          backgroundColor: ['#737474', '#a0a0a0', '#737474'],
          opacity: [0.7, 1, 0.7],
        }"
        :transition="{
          duration: item.duration,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: item.delay,
        }"
      >
      </motion.span>
    </div>
    <div class="zmd-sidebar-line">
      <motion.span
        v-for="(item, index) of lineSpecs[3]"
        :key="index"
        :style="{ width: item.width, marginRight: item.margin || '0' }"
        :animate="{
          backgroundColor: ['#737474', '#a0a0a0', '#737474'],
          opacity: [0.7, 1, 0.7],
        }"
        :transition="{
          duration: item.duration,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: item.delay,
        }"
      >
      </motion.span>
    </div>
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);

// 定义线条配置，使用 motion-v 的动画方式替代 CSS 动画
// 这样可以利用 GPU 加速，提高性能
const lineSpecs = [
  // 第一行
  [
    { width: '6.2%', margin: '1%', duration: 2.2, delay: 0.3 },
    { width: '6.2%', margin: '3%', duration: 1.8, delay: 0.7 },
    { width: '28%', margin: '3%', duration: 3, delay: 0.2 },
    { width: '9%', margin: '4%', duration: 2.5, delay: 1.1 },
    { width: '4%', margin: '1%', duration: 1.7, delay: 0.5 },
    { width: '11%', margin: '1%', duration: 2.8, delay: 0.9 },
    { width: '8%', duration: 2.1, delay: 0.4 },
  ],
  // 第二行
  [
    { width: '6.2%', margin: '1%', duration: 2.3, delay: 0.6 },
    { width: '23%', margin: '1%', duration: 1.9, delay: 1.2 },
    { width: '10%', margin: '3%', duration: 2.7, delay: 0.3 },
    { width: '11%', margin: '1%', duration: 2.2, delay: 0.8 },
    { width: '14%', margin: '1%', duration: 3.1, delay: 0.2 },
    { width: '8%', margin: '1%', duration: 1.6, delay: 1 },
  ],
  // 第三行
  [
    { width: '53%', margin: '1%', duration: 2.6, delay: 0.5 },
    { width: '12%', margin: '5%', duration: 1.8, delay: 1.3 },
    { width: '5%', margin: '1%', duration: 2.9, delay: 0.1 },
    { width: '12%', margin: '1%', duration: 2.4, delay: 0.9 },
    { width: '9%', margin: '1%', duration: 2, delay: 0.7 },
  ],
  // 第四行
  [
    { width: '6.2%', margin: '1%', duration: 2.5, delay: 0.4 },
    { width: '6.2%', margin: '3%', duration: 1.9, delay: 1.1 },
    { width: '28%', margin: '2.7%', duration: 2.7, delay: 0.2 },
    { width: '9%', margin: '3.8%', duration: 2.3, delay: 0.8 },
    { width: '4%', margin: '1%', duration: 3.2, delay: 0.5 },
    { width: '11%', margin: '1%', duration: 1.7, delay: 1.2 },
    { width: '8%', duration: 2.1, delay: 0.3 },
  ],
];
</script>

<style lang="scss" scoped>
@use '../../../styles/zmd.scss' as zmd;

.zmd-sidebar-lines {
  width: 8.4em;
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  .zmd-sidebar-line {
    height: 1.5px;
    display: flex;
    span {
      height: 1.5px;
      background-color: #737474;
      border-radius: 1.5px;
    }
  }
}
</style>
