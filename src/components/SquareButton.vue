<template>
  <button
    class="square-button"
    :class="{
      'is-loading': loading,
      'is-disabled': disabled,
    }"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <motion.div
      v-if="loading"
      class="loading-spinner"
      :animate="{
        rotate: 360,
      }"
      :transition="{
        duration: 0.8,
        ease: 'linear',
        repeat: Infinity,
      }"
    ></motion.div>
    <span
      v-else
      class="button-content"
    >
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);
</script>

<style scoped>
.square-button {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 0.5em 1em;
  background-color: #000;
  color: white;
  border: none;
  outline: none;
  transition: all 0.2s ease;
  font-size: 1rem;
  min-width: 100px;
  min-height: 40px;
  /* 内部灰色描边使用 box-shadow 实现 */
  box-shadow: inset 0 0 0 2px rgba(128, 128, 128, 0.5);
  /* 确保描边与外边缘有0.2em的距离 */
  position: relative;
}

/* 使用伪元素创建距离边缘0.2em的内描边 */
.square-button::before {
  content: '';
  position: absolute;
  top: 0.2em;
  left: 0.2em;
  right: 0.2em;
  bottom: 0.2em;
  box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.8);
  pointer-events: none;
}

.square-button:hover:not(.is-disabled, .is-loading) {
  background-color: #333;
}

.square-button:active:not(.is-disabled, .is-loading) {
  background-color: #111;
  transform: scale(0.98);
}

.square-button.is-disabled {
  opacity: 0.6;
  background-color: #222;
}

/* 加载动画 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
}

/* 按钮内容样式 */
.button-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>
