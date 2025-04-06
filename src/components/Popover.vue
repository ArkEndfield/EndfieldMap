<template>
  <div
    @mouseenter="showPopover = true"
    @mouseleave="showPopover = false"
  >
    <div ref="triggerRef"><slot></slot></div>
    <div
      ref="popoverRef"
      v-show="showPopover"
      :class="[
        'arknights-popover absolute py-3 px-5 shadow-lg w-max max-w-64 text-sm',
      ]"
      :style="popoverStyle"
    >
      <div class="scanline-container">
        <div class="scanline"></div>
      </div>
      <div class="popover-corner popover-corner-tl"></div>
      <div class="popover-corner popover-corner-tr"></div>
      <div class="popover-corner popover-corner-bl"></div>
      <div class="popover-corner popover-corner-br"></div>
      <slot name="popover"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted, watch } from 'vue';

const props = withDefaults(
  defineProps<{ placement?: 'top' | 'bottom' | 'left' | 'right' }>(),
  {
    placement: 'bottom',
  }
);

const showPopover = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({
  opacity: '0',
  transform: 'translateY(-10px)',
  transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
});

function recalcPosition() {
  if (!triggerRef.value || !popoverRef.value) {
    return;
  }

  // 初始隐藏弹窗，但不影响尺寸测量
  popoverRef.value.style.opacity = '0';
  popoverRef.value.style.pointerEvents = 'none';

  // 获取元素尺寸
  const triggerRect = triggerRef.value.getBoundingClientRect();
  const popoverRect = popoverRef.value.getBoundingClientRect();

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
  const parentRect = popoverRef.value.offsetParent?.getBoundingClientRect() || {
    left: 0,
    top: 0,
  };
  const relativeLeft = left - parentRect.left;
  const relativeTop = top - parentRect.top;

  // 应用位置样式 (不包含动画相关样式)
  popoverStyle.value = {
    left: `${relativeLeft}px`,
    top: `${relativeTop}px`,
    opacity: '0',
    transform: 'translateY(-10px)',
    transition:
      'opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
    pointerEvents: 'none',
  };

  // 使用RAF确保在下一帧应用动画样式
  requestAnimationFrame(() => {
    if (popoverRef.value && showPopover.value) {
      popoverStyle.value = {
        ...popoverStyle.value,
        opacity: '1',
        transform: 'translateY(0)',
        pointerEvents: 'auto',
      };
    }
  });
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
      if (popoverRef.value) {
        popoverStyle.value = {
          ...popoverStyle.value,
          opacity: '0',
          transform: 'translateY(-10px)',
          pointerEvents: 'none',
        };
      }
      window.removeEventListener('resize', recalcPosition);
    }
  }
);

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
  animation: scanline 3s infinite ease-in-out;
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

@keyframes scanline {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

// 修改动画配置，使动画更加流畅
:deep(.v-enter-active),
:deep(.v-leave-active) {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  will-change: opacity, transform;
}

:deep(.v-enter-from),
:deep(.v-leave-to) {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}
</style>
