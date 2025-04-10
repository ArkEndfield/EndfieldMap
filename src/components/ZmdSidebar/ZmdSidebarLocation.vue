<template>
  <div class="zmd-sidebar-location">
    <div class="zmd-sidebar-location-container">
      <div
        class="zmd-sidebar-location-marker"
        :style="markerStyle"
      >
        <motion.div
          class="zmd-sidebar-location-content"
          :style="{ perspective: props.rotationEnabled ? '800px' : 'none' }"
          :animate="rotationAnimationProps"
          :transition="{
            duration: 4,
            ease: 'linear',
            repeat: Infinity,
          }"
        >
          <div class="zmd-sidebar-location-ring"></div>
          <div class="zmd-sidebar-location-triangle"></div>
        </motion.div>
        <div class="zmd-sidebar-location-shadow"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { motion } from 'motion-v';

interface Props {
  iconColor?: string;
  shadowColor?: string;
  rotationEnabled?: boolean; // 添加控制旋转动画的属性
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: '#FDFB55',
  shadowColor: 'rgba(255, 255, 255, 0.1)',
  rotationEnabled: false, // 默认不启用旋转
});

const markerStyle = computed(() => ({
  '--icon-color': props.iconColor,
  '--shadow-color': props.shadowColor,
}));

// 根据是否启用旋转来设置旋转动画
const rotationAnimationProps = computed(() => {
  if (!props.rotationEnabled) return {};

  return {
    rotateY: [0, 360],
    // perspective不是可动画的属性，应该通过style设置
    transformStyle: 'preserve-3d',
  };
});
</script>

<style lang="scss" scoped>
.zmd-sidebar-location {
  &-container {
    display: block;
    position: relative;
    width: 2.5em;
    aspect-ratio: 0.75;
  }

  &-marker {
    position: relative;
    width: 100%;
    height: 100%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    --icon-color: #fdfb55;
    --shadow-color: rgba(0, 0, 0, 0.3);
  }

  &-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform-style: preserve-3d;
    position: relative;
  }

  &-ring {
    width: 1.5em;
    height: 1.5em;
    flex-shrink: 0;
    border-radius: 50%;
    border: 0.4em solid var(--icon-color);
    background-color: transparent;
    position: relative;
    z-index: 3;
    backface-visibility: visible;
  }

  &-triangle {
    width: 1.25em;
    height: 1.25em;
    background-color: var(--icon-color);
    position: relative;
    top: -10%;
    z-index: 2;
    clip-path: polygon(50% 100%, 0 0, 100% 0);
    backface-visibility: visible;
  }

  &-shadow {
    width: 2em;
    height: 0.7em;
    border-radius: 50%;
    background-color: var(--shadow-color);
    position: absolute;
    bottom: 0.6em;
    z-index: 1 !important;
  }
}
</style>
