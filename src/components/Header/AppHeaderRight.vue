<template>
  <div class="fixed right-0 top-0 z-[50] md:z-[56] text-white">
    <div
      ref="triggerRef"
      class="flex flex-col items-end py-1 px-4"
    >
      <button
        class="text-xs group"
        @click="togglePopover"
      >
        <div
          class="bg-[#1E1E1D] group-hover:bg-black transition-colors h-3 pl-1.5 z-0 relative flex items-center gap-1"
        >
          <div class="text-[#FBFA54] mt-1">
            <SwitchIcon />
          </div>
          <div class="mt-1 pr-1">{{ $t('header.change_region') }}</div>
        </div>
        <div
          class="with-clip-path bg-[#1E1E1D] group-hover:bg-black transition-colors -z-1 relative"
        ></div>
      </button>
      <div
        class="text-3xl font-extrabold [text-shadow:0_0_0.1em_rgba(0,0,0,0.2)]"
      >
        四号谷地
      </div>
    </div>
    <Transition
      @before-enter="recalcPosition"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        ref="popoverRef"
        v-show="showPopover"
        :class="['absolute bg-[#222222] shadow-lg w-64 overflow-hidden']"
        :style="popoverStyle"
      >
        <div class="py-2 px-4 h-full">
          <div class="line left-2"></div>
          <div class="line right-2"></div>
          <div class="flex flex-col gap-1 h-full justify-between">
            <MapButton>四号谷地</MapButton>
            <MapButton active>四号谷地</MapButton>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { animate, spring } from 'motion';

const showPopover = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({});
const animateConfig = { duration: 0.3, type: spring, bounce: 0.3 };
const animation = {
  opacity: [0, 1],
  y: ['-10px', '0px'],
};

function togglePopover() {
  showPopover.value = !showPopover.value;
}

function clickOutside(event: MouseEvent) {
  if (!showPopover.value) return;

  const target = event.target as Node;
  if (
    popoverRef.value &&
    !popoverRef.value.contains(target) &&
    triggerRef.value &&
    !triggerRef.value.contains(target)
  ) {
    showPopover.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', clickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', clickOutside);
});

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
    const offset = 8; // 间隙

    let left = 0,
      top = 0;
    let desiredGlobalLeft =
      triggerRect.left + triggerRect.width / 2 - popWidth / 2;
    desiredGlobalLeft = Math.max(
      0,
      Math.min(desiredGlobalLeft, window.innerWidth - popWidth)
    );
    left = desiredGlobalLeft - containerRect.left;
    top = triggerRect.bottom - containerRect.top + offset;
    popoverStyle.value = { left: left + 'px', top: top + 'px' };
  });
}

async function onEnter(el: Element, done: () => void) {
  await animate(
    el,
    {
      opacity: animation.opacity,
      y: animation.y,
      height: ['0px', 'auto'],
    },
    animateConfig
  );
  done();
}

async function onLeave(el: Element, done: () => void) {
  await animate(
    el,
    {
      opacity: animation.opacity.toReversed(),
      y: animation.y.toReversed(),
      height: ['auto', '0px'],
    },
    animateConfig
  );
  done();
}
</script>

<style lang="scss" scoped>
.with-clip-path {
  $height: 0.3rem;
  $clip: polygon(0% 0%, 100% 0%, 100% $height, $height 100%);
  height: $height;
  -webkit-clip-path: $clip;
  clip-path: $clip;
  margin-bottom: -0.01em;
}
.line {
  position: absolute;
  top: 0;
  bottom: 0;
  &::before,
  &::after {
    content: '';
    display: block;
    background-color: #f9f853;
    width: 1.5px;
    position: absolute;
  }
  &::before {
    height: 1.5px;
    top: 0.5em;
  }
  &::after {
    top: 0.8em;
    bottom: 0.5em;
  }
}
</style>
