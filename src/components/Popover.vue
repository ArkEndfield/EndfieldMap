<template>
  <div
    class="relative"
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
          'absolute mt-2 py-2 px-4 bg-[#1D1D1D]/60 rounded-lg shadow-lg w-max max-w-32 text-sm backdrop-blur-md',
        ]"
        :style="popoverStyle"
      >
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

<style lang="scss" scoped></style>
