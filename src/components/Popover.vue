<template>
  <div>
    <div
      @mouseenter="showPopover = true"
      @mouseleave="showPopover = false"
      ref="triggerRef"
    >
      <slot></slot>
    </div>
    <Teleport to="body">
      <AnimatePresence :initial="false">
        <motion.div
          ref="popoverRef"
          v-if="showPopover"
          :class="[
            'arknights-popover absolute shadow-lg w-max z-[57]',
            sizeClass,
            {
              'pointer-events-none': props.noEvent,
            },
          ]"
          :initial="getInitialAnimation"
          :animate="getAnimateAnimation"
          :style="{
            left: position.left + 'px',
            top: position.top + 'px',
          }"
          :exit="getExitAnimation"
          :transition="{
            duration: 0.1,
          }"
        >
          <div class="scanline-container">
            <div class="scanline"></div>
          </div>
          <div class="popover-corner popover-corner-tl"></div>
          <div class="popover-corner popover-corner-tr"></div>
          <div class="popover-corner popover-corner-bl"></div>
          <div class="popover-corner popover-corner-br"></div>
          <slot name="popover"></slot>
        </motion.div>
      </AnimatePresence>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { motion, AnimatePresence, useAnimate } from 'motion-v';
import { ref, nextTick, onMounted, onUnmounted, watch, computed } from 'vue';
const [popoverRef] = useAnimate();
const props = withDefaults(
  defineProps<{
    placement?: 'top' | 'bottom' | 'left' | 'right';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    noEvent?: boolean;
  }>(),
  {
    placement: 'bottom',
    size: 'md',
    noEvent: false,
  }
);

const showPopover = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const position = ref({ left: 0, top: 0 });

// 计算尺寸类名
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-[12rem] text-xs py-2 px-3';
    case 'md':
      return 'max-w-[16rem] text-sm py-3 px-4';
    case 'lg':
      return 'max-w-[20rem] text-base py-4 px-5';
    case 'xl':
      return 'max-w-[24rem] text-lg py-5 px-6';
    default:
      return 'max-w-[16rem] text-sm py-3 px-4';
  }
});

// 根据 placement 获取初始动画状态
const getInitialAnimation = computed(() => {
  const base = { opacity: 0 };
  switch (props.placement) {
    case 'top':
      return { ...base, y: 10 };
    case 'bottom':
      return { ...base, y: -10 };
    case 'left':
      return { ...base, x: 10 };
    case 'right':
      return { ...base, x: -10 };
    default:
      return { ...base, y: -10 };
  }
});

// 根据 placement 获取动画状态
const getAnimateAnimation = computed(() => {
  const base = { opacity: showPopover.value ? 1 : 0 };
  switch (props.placement) {
    case 'top':
      return { ...base, y: showPopover.value ? 0 : 10 };
    case 'bottom':
      return { ...base, y: showPopover.value ? 0 : -10 };
    case 'left':
      return { ...base, x: showPopover.value ? 0 : 10 };
    case 'right':
      return { ...base, x: showPopover.value ? 0 : -10 };
    default:
      return { ...base, y: showPopover.value ? 0 : -10 };
  }
});

// 根据 placement 获取退出动画状态
const getExitAnimation = computed(() => {
  const base = { opacity: 0 };
  switch (props.placement) {
    case 'top':
      return { ...base, y: 10 };
    case 'bottom':
      return { ...base, y: -10 };
    case 'left':
      return { ...base, x: 10 };
    case 'right':
      return { ...base, x: -10 };
    default:
      return { ...base, y: -10 };
  }
});

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
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(220, 220, 220, 0.08),
    transparent
  );
  animation: scanline-move 3s ease-in-out infinite;
}

@keyframes scanline-move {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
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
