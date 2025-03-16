<template>
  <div
    class="relative"
    @mouseenter="showPopover = true"
    @mouseleave="showPopover = false"
  >
    <button
      ref="triggerRef"
      class="text-3xl block cursor-default md:cursor-pointer"
    >
      <slot></slot>
    </button>
    <Transition
      @before-enter="recalcPosition"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        ref="popoverRef"
        v-show="showPopover"
        :class="[
          'absolute mt-2 py-2 px-4 bg-[#1D1D1D]/60 rounded-lg shadow-lg w-max max-w-24 text-sm backdrop-blur-md',
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

const showPopover = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({});

// 修改 recalcPosition：使用全局坐标计算 desiredGlobalLeft 并限制在屏幕内
function recalcPosition(el: Element) {
  nextTick(() => {
    if (!triggerRef.value) {
      popoverStyle.value = { left: '0px' };
      return;
    }
    const triggerRect = triggerRef.value.getBoundingClientRect();
    const container = triggerRef.value.offsetParent as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const popWidth = el.getBoundingClientRect().width || 200;
    // 计算期望的全局 left: 让 popover 居中于按钮
    let desiredGlobalLeft =
      triggerRect.left + triggerRect.width / 2 - popWidth / 2;
    // 限制在屏幕范围内
    desiredGlobalLeft = Math.max(
      0,
      Math.min(desiredGlobalLeft, window.innerWidth - popWidth)
    );
    // 转换为相对于容器的 left
    const relativeLeft = desiredGlobalLeft - containerRect.left;
    popoverStyle.value = { left: relativeLeft + 'px' };
  });
}

async function onEnter(el: Element, done: () => void) {
  await animate(
    el,
    { opacity: [0, 1], y: ['-10px', '0px'] },
    { duration: 0.3, type: spring, bounce: 0.3 }
  );
  done();
}

async function onLeave(el: Element, done: () => void) {
  await animate(
    el,
    { opacity: [1, 0], y: ['0px', '-10px'] },
    { duration: 0.3, type: spring, bounce: 0.3 }
  );
  done();
}
</script>

<style lang="scss" scoped></style>
