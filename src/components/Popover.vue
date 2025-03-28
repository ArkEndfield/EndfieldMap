<template>
  <div
    @mouseenter="showPopover = true"
    @mouseleave="showPopover = false"
  >
    <div ref="triggerRef"><slot></slot></div>
    <Transition
      @before-enter="recalcPosition"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        ref="popoverRef"
        v-show="showPopover"
        :class="[
          'arknights-popover absolute mt-2 py-3 px-5 shadow-lg w-max max-w-64 text-sm',
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
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { animate, spring } from 'motion';

const props = withDefaults(
  defineProps<{ placement?: 'top' | 'bottom' | 'left' | 'right' }>(),
  {
    placement: 'bottom',
  }
);

const showPopover = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({});
const animateConfig = { duration: 0.3, type: spring, bounce: 0.3 };
const animation = {
  opacity: [0, 1],
  y: ['-10px', '0px'],
};

function recalcPosition(el: Element) {
  nextTick(() => {
    if (!triggerRef.value) {
      popoverStyle.value = { left: '0px', top: '0px' };
      return;
    }
    const triggerRect = triggerRef.value.getBoundingClientRect();
    const container = triggerRef.value.offsetParent as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const popRect = el.getBoundingClientRect();
    const popWidth = popRect.width || 200;
    const popHeight = popRect.height || 50;
    const offset = 8; // 间隙

    let left = 0,
      top = 0;
    switch (props.placement) {
      case 'bottom': {
        // popover 水平居中
        let desiredGlobalLeft =
          triggerRect.left + triggerRect.width / 2 - popWidth / 2;
        desiredGlobalLeft = Math.max(
          0,
          Math.min(desiredGlobalLeft, window.innerWidth - popWidth)
        );
        left = desiredGlobalLeft - containerRect.left;
        top = triggerRect.bottom - containerRect.top + offset;
        break;
      }
      case 'top': {
        let desiredGlobalLeft =
          triggerRect.left + triggerRect.width / 2 - popWidth / 2;
        desiredGlobalLeft = Math.max(
          0,
          Math.min(desiredGlobalLeft, window.innerWidth - popWidth)
        );
        left = desiredGlobalLeft - containerRect.left;
        top = triggerRect.top - containerRect.top - popHeight - offset;
        break;
      }
      case 'left': {
        left = triggerRect.left - containerRect.left - popWidth - offset;
        top =
          triggerRect.top -
          containerRect.top +
          triggerRect.height / 2 -
          popHeight / 2;
        // 可加边界处理，如垂直方向限制
        top =
          Math.max(0, Math.min(top, window.innerHeight - popHeight)) -
          containerRect.top;
        break;
      }
      case 'right': {
        left = triggerRect.right - containerRect.left + offset;
        top =
          triggerRect.top -
          containerRect.top +
          triggerRect.height / 2 -
          popHeight / 2;
        // 可加边界处理，如垂直方向限制
        top =
          Math.max(0, Math.min(top, window.innerHeight - popHeight)) -
          containerRect.top;
        break;
      }
      default: {
        // 默认 bottom
        let desiredGlobalLeft =
          triggerRect.left + triggerRect.width / 2 - popWidth / 2;
        desiredGlobalLeft = Math.max(
          0,
          Math.min(desiredGlobalLeft, window.innerWidth - popWidth)
        );
        left = desiredGlobalLeft - containerRect.left;
        top = triggerRect.bottom - containerRect.top + offset;
        break;
      }
    }
    popoverStyle.value = { left: left + 'px', top: top + 'px' };
  });
}

async function onEnter(el: Element, done: () => void) {
  await animate(
    el,
    { opacity: animation.opacity, y: animation.y },
    animateConfig
  );
  done();
}

async function onLeave(el: Element, done: () => void) {
  await animate(
    el,
    { opacity: animation.opacity.toReversed(), y: animation.y.toReversed() },
    animateConfig
  );
  done();
}
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
  height: 8px;
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
