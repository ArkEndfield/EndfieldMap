<template>
  <div class="fixed right-0 top-0 z-[50] md:z-[56] text-white w-[12em]">
    <div
      ref="triggerRef"
      class="flex flex-col items-end pb-1 pt-4 md:pt-1 px-4"
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
        class="text-3xl font-extrabold [text-shadow:0_0_0.1em_rgba(0,0,0,0.2)] hover:text-[#fdfb55]"
        @click="togglePopover"
      >
        {{ $t(`map.${cacheMapId}`) }}
      </div>
    </div>
    <motion.div
      ref="popoverRef"
      v-show="showPopover"
      :class="[
        'absolute bg-[#222222] shadow-lg w-64 overflow-hidden right-0 top-full',
      ]"
      :style="popoverStyle"
      :animate="{
        opacity: showPopover ? 1 : 0,
        y: showPopover ? 4 : '-10px',
        display: showPopover ? 'block' : 'none',
      }"
      :transition="{
        duration: 0.3,
        type: 'spring',
        bounce: 0.3,
      }"
      :initial="{
        opacity: 0,
        y: '-10px',
        display: 'none',
      }"
    >
      <div class="py-2 px-4 h-full">
        <div class="line left-2"></div>
        <div class="line right-2"></div>
        <div class="flex flex-col gap-1 h-full justify-between">
          <MapButton
            :active="cacheMapId === 'map001'"
            @click="selectMap('map001')"
            >{{ $t('map.map001') }}</MapButton
          >
          <MapButton
            :active="cacheMapId === 'map002'"
            @click="selectMap('map002')"
            >{{ $t('map.map002') }}</MapButton
          >
        </div>
      </div>
    </motion.div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { cacheMapId, selectMap } from '../map/MapCore';
import { motion } from 'motion-v';

const showPopover = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({});

function togglePopover() {
  showPopover.value = !showPopover.value;
}

function clickOutside(event: MouseEvent) {
  if (!showPopover.value) return;

  const target = event.target as Node;
  if (
    popoverRef.value &&
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
