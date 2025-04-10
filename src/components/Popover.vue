<template>
  <div
    @mouseenter="showPopover = true"
    @mouseleave="showPopover = false"
  >
    <div ref="triggerRef"><slot></slot></div>
    <AnimatePresence :initial="false">
      <motion.div
        ref="popoverRef"
        v-show="showPopover"
        :class="[
          'arknights-popover absolute py-3 px-5 shadow-lg w-max max-w-64 text-sm',
        ]"
        :initial="{
          opacity: 0,
          y: -10,
        }"
        :animate="{
          opacity: showPopover ? 1 : 0,
          y: showPopover ? 0 : -10,
        }"
        :style="{
          left: position.left + 'px',
          top: position.top + 'px',
        }"
        :exit="{
          opacity: 0,
          y: -10,
        }"
        :transition="{
          duration: 0.1,
        }"
      >
        <div class="scanline-container">
          <motion.div
            class="scanline"
            :animate="{
              left: ['-100%', '200%'],
            }"
            :transition="{
              duration: 3,
              ease: 'easeInOut',
              repeat: Infinity,
            }"
          ></motion.div>
        </div>
        <div class="popover-corner popover-corner-tl"></div>
        <div class="popover-corner popover-corner-tr"></div>
        <div class="popover-corner popover-corner-bl"></div>
        <div class="popover-corner popover-corner-br"></div>
        <slot name="popover"></slot>
      </motion.div>
    </AnimatePresence>
  </div>
</template>

<script setup lang="ts">
import { motion, AnimatePresence, useAnimate } from 'motion-v';
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
const [popoverRef] = useAnimate();
const props = withDefaults(
  defineProps<{ placement?: 'top' | 'bottom' | 'left' | 'right' }>(),
  {
    placement: 'bottom',
  }
);

const showPopover = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const position = ref({ left: 0, top: 0 });

function recalcPosition() {
  if (!triggerRef.value || !popoverRef.value) {
    return;
  }
  const popoverElement = popoverRef.value as HTMLElement;
  // 获取元素尺寸
  const triggerRect = triggerRef.value.getBoundingClientRect();
  const popoverRect = popoverElement.getBoundingClientRect();

  // 计算弹窗尺寸
  const popWidth = popoverRect.width;
  const popHeight = popoverRect.height;
  const offset = 8; // 间隙

  // 计算相对于视口的位置
  let left = 0,
    top = 0;

  switch (props.placement) {
    case 'bottom': {
      left = triggerRect.left + triggerRect.width / 2 - popWidth / 2;
      top = triggerRect.bottom + offset;
      break;
    }
    case 'top': {
      left = triggerRect.left + triggerRect.width / 2 - popWidth / 2;
      top = triggerRect.top - popHeight - offset;
      break;
    }
    case 'left': {
      left = triggerRect.left - popWidth - offset;
      top = triggerRect.top + triggerRect.height / 2 - popHeight / 2;
      break;
    }
    case 'right': {
      left = triggerRect.right + offset;
      top = triggerRect.top + triggerRect.height / 2 - popHeight / 2;
      break;
    }
    default: {
      left = triggerRect.left + triggerRect.width / 2 - popWidth / 2;
      top = triggerRect.bottom + offset;
      break;
    }
  }

  // 防止弹窗超出视口边界
  left = Math.max(
    offset,
    Math.min(left, window.innerWidth - popWidth - offset)
  );
  top = Math.max(
    offset,
    Math.min(top, window.innerHeight - popHeight - offset)
  );

  // 转换为相对于父容器的位置
  const parentRect = popoverElement.offsetParent?.getBoundingClientRect() || {
    left: 0,
    top: 0,
  };
  const relativeLeft = left - parentRect.left;
  const relativeTop = top - parentRect.top;
  position.value = { left: relativeLeft, top: relativeTop };
}

// 监听弹窗显示状态变化
watch(
  () => showPopover.value,
  newVal => {
    if (newVal) {
      nextTick(() => {
        recalcPosition();
        window.addEventListener('resize', recalcPosition);
      });
    } else {
      window.removeEventListener('resize', recalcPosition);
    }
  }
);

onMounted(() => {
  // 组件挂载后计算初始位置
  nextTick(() => {
    recalcPosition();
  });
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('resize', recalcPosition);
});
</script>

<style lang="scss" scoped>
.arknights-popover {
  background: rgba(29, 32, 37, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(158, 158, 158, 0.3);
  color: #e5e5e5;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(253, 253, 89, 0.6),
      transparent
    );
    animation: pulse 2s infinite ease-in-out;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(180, 180, 180, 0.4),
      transparent
    );
  }
}

// 扫描线容器
.scanline-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
  border-radius: 1px;
}

// 扫描线
.scanline {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(220, 220, 220, 0.08),
    transparent
  );
}

.popover-corner {
  position: absolute;
  width: 8px;
  height: calc(50% + 1px);
  border-color: rgba(220, 220, 220, 0.7);
  z-index: 2;

  &-tl {
    top: -1px;
    left: -1px;
    border-top: 2px solid;
    border-left: 2px solid;
  }

  &-tr {
    top: -1px;
    right: -1px;
    border-top: 2px solid;
    border-right: 2px solid;
  }

  &-bl {
    bottom: -1px;
    left: -1px;
    border-bottom: 2px solid;
    border-left: 2px solid;
  }

  &-br {
    bottom: -1px;
    right: -1px;
    border-bottom: 2px solid;
    border-right: 2px solid;
  }
}

// 动画关键帧
@keyframes pulse {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}
</style>
