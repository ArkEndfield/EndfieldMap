<template>
  <div class="app-header-right-container">
    <div class="fixed right-0 top-0 z-[50] md:z-[56] text-white w-[12em]">
      <div
        ref="triggerRef"
        class="flex flex-col items-end pb-1 pt-4 md:pt-1 px-4"
        id="change-map"
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
            <div class="mt-1 pr-1">{{ t('header.change_region') }}</div>
          </div>
          <div
            class="with-clip-path bg-[#1E1E1D] group-hover:bg-black transition-colors -z-1 relative"
          ></div>
        </button>
        <div
          class="text-3xl font-extrabold [text-shadow:0_0_0.1em_rgba(0,0,0,0.2)] hover:text-[#fdfb55]"
          @click="togglePopover"
        >
          {{ t(`map.${cacheMapId}`) }}
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
              @click="changeMap('map001')"
              >{{ t('map.map001') }}</MapButton
            >
            <MapButton
              :active="cacheMapId === 'map002'"
              @click="changeMap('map002')"
              >{{ t('map.map002') }}</MapButton
            >
          </div>
        </div>
      </motion.div>
    </div>
    <motion.div
      class="map-animate fixed top-0 left-0 right-0 z-[50] md:z-[56] flex flex-col items-center bg-gradient-to-b from-[rgba(0,0,0,0.8)] via-[rgba(0,0,0,0.4)] to-[rgba(0,0,0,0)] pb-4"
      :animate="{
        opacity: showChangeAnimation ? 1 : 0,
        y: showChangeAnimation ? 0 : '-10px',
        display: showChangeAnimation ? 'flex' : 'none',
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
      <div
        class="absolute -bottom-10 bg-[url('/images/bg_solution_machine_2.png')] bg-contain -z-10 w-42 h-42"
      ></div>
      <div
        class="absolute -bottom-10 bg-[url('/images/bg_energybar.png')] bg-contain -z-10 w-42 h-42"
      ></div>
      <motion.div
        class="text-4xl font-bold text-white [text-shadow:0_0_0.1em_rgba(0,0,0,0.2)]"
        :animate="{
          y: showChangeAnimation ? 0 : '1em',
        }"
        :transition="{
          duration: 0.8,
          type: 'spring',
          bounce: 0.3,
        }"
        :initial="{
          y: '1em',
        }"
      >
        {{ t(`map.${cacheMapId}`) }}
      </motion.div>
      <motion.div
        class="bg-[#272727] text-[#EDEBED] text-sm px-5 relative z-10"
        :animate="{
          y: showChangeAnimation ? 0 : '1.5em',
        }"
        :transition="{
          duration: 0.8,
          type: 'spring',
          bounce: 0.3,
        }"
        :initial="{
          y: '1.5em',
        }"
      >
        {{ t('header.map_change') }}
      </motion.div>
      <motion.div
        class="bg-gradient-to-r from-[rgba(252,250,84,0)] via-[rgba(252,250,84,0.5)] to-[rgba(252,250,84,0)] h-1"
        :animate="{
          width: showChangeAnimation ? '80%' : 0,
        }"
        :transition="{
          duration: 0.5,
          type: 'spring',
          bounce: 0.3,
          delay: 0.1,
        }"
        :initial="{
          width: 0,
        }"
      ></motion.div>
      <motion.div
        class="absolute bottom-3 flex h-3 gap-0.5"
        :animate="{
          width: showChangeAnimation ? '8rem' : 0,
        }"
        :transition="{
          duration: 0.5,
          type: 'spring',
          bounce: 0.3,
          delay: 0.1,
        }"
        :initial="{
          width: 0,
        }"
      >
        <div class="shrink-0 grow-0 flex flex-col gap-[1px] w-0.5">
          <div class="bg-[#fff] h-[1px] shrink-0 grow-0"></div>
          <div class="bg-[#fff] flex-1"></div>
          <div class="bg-[#fff] h-[1px] shrink-0 grow-0"></div>
        </div>
        <div class="bg-[#FDFB72] h-1 flex-1 mt-1"></div>
        <div class="shrink-0 grow-0 flex flex-col gap-[1px] w-0.5">
          <div class="bg-[#fff] h-[1px] shrink-0 grow-0"></div>
          <div class="bg-[#fff] flex-1"></div>
          <div class="bg-[#fff] h-[1px] shrink-0 grow-0"></div>
        </div>
      </motion.div>
    </motion.div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { cacheMapId, selectMap } from '@/services/map';
import { motion } from 'motion-v';
import { rafTimeout } from '@/utils/animationTimer';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const showPopover = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({});
const showChangeAnimation = ref(false);

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

function changeMap(mapId: string) {
  selectMap(mapId);
  showChangeAnimation.value = true;
  rafTimeout(() => {
    showChangeAnimation.value = false;
  }, 1500);
}

onMounted(() => {
  document.addEventListener('click', clickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', clickOutside);
});
</script>

<style lang="scss" scoped>
@use '@/styles/zmd.scss' as zmd;
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
.map-animate {
  padding-top: calc(zmd.$side-margin-y + 1rem);
}
</style>
