<template>
  <div class="fixed right-2 bottom-18 md:bottom-12 w-64">
    <ListTitle
      color="#1F1F20"
      class="w-64 transition-[width] ml-auto"
      :class="{
        '!w-50': !settings.swiperExpanded,
      }"
      :solid="false"
      titleFontSize="1rem"
      backTitleFontSize="1.25rem"
      bracket
    >
      BREAKING NEWS
      <template #backTitle>
        ENDFIELD
      </template>
      <template #right>
        <button
          class="bg-[#FDFD59] text-[#272727] text-xs font-bold rounded-full px-2 py-0.5 hover:bg-[#FDFD59] active:bg-[#f2f27a] transition-all duration-200 flex items-center gap-1 mb-0.5"
          :class="{
            'mb-1': settings.swiperExpanded,
          }"
          ref="button"
          @click="settings.swiperExpanded = !settings.swiperExpanded"
        >
          <div>{{ t(settings.swiperExpanded ? 'fold' : 'unfold') }}</div>
        </button>
      </template>
    </ListTitle>
    <motion.div
      :initial="{ height: 0 }"
      :animate="{ height: settings.swiperExpanded ? '9rem' : '0' }"
      :transition="settings.swiperExpanded ? { duration: 0.5, type: 'spring', bounce: 0.25 } : { duration: 0.3 }"
      class="overflow-hidden"
    >
      <swiper
        :space-between="30"
        :modules="modules"
        loop
        pagination
        :autoplay="{ delay: 2500, disableOnInteraction: false }"
        @autoplayTimeLeft="onAutoplayTimeLeft"
        class="h-36 bg-[#1F1F20] shadow-lg text-white"
      >
      <swiper-slide v-for="i in 9" :key="i" class="!flex items-center justify-center text-2xl font-bold">
        Slide {{ i }}
      </swiper-slide>
      <template #container-end>
        <div class="autoplay-progress">
          <svg viewBox="0 0 48 48" ref="progressCircle">
            <circle cx="24" cy="24" r="20"></circle>
          </svg>
          <span ref="progressContent"></span>
        </div>
      </template>
    </swiper>
    </motion.div>
  </div>
  
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Autoplay } from 'swiper/modules'
import { ref } from 'vue'
import { motion } from 'motion-v'
import SwiperType from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { useI18n } from 'vue-i18n'
import settings from '@/data/settings'

const modules = [Pagination, Autoplay]
const { t } = useI18n()

const progressCircle = ref()
const progressContent = ref()

const onAutoplayTimeLeft = (_: SwiperType, time: number, progress: number) => {
  progressCircle.value.style.setProperty('--progress', 1 - progress);
  progressContent.value.textContent = Math.ceil(time / 1000);
};

</script>

<style scoped>
.swiper {
  --swiper-theme-color: #DFD54A;
  --swiper-pagination-bullet-inactive-color: #818182;
}

:deep(.swiper-pagination) {
  position: absolute;
  bottom: 0 !important;
  top: auto !important;
  left: 0;
  right: 0;
  display: flex;
  gap: 3px;
}

:deep(.swiper-pagination-bullet) {
  flex: 1;
  height: 6px;
  border-radius: 0;
  background-color: var(--swiper-pagination-bullet-inactive-color);
  opacity: 1;
  margin: 0 !important;
}

:deep(.swiper-pagination-bullet-active) {
  background-color: var(--swiper-theme-color);
}

.autoplay-progress {
  position: absolute;
  right: 0.5em;
  bottom: 1em;
  z-index: 1;
  width: 1.5em;
  height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: var(--swiper-theme-color);
}

.autoplay-progress svg {
  --progress: 0;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  stroke-width: 0.4em;
  stroke: var(--swiper-theme-color);
  fill: none;
  stroke-dashoffset: calc(125.6px * (1 - var(--progress)));
  stroke-dasharray: 125.6;
  transform: rotate(-90deg);
}

.autoplay-progress span {
  font-size: 0.75em;
}
</style>
