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
              :disabled="isLoading"
              @click="changeMap('map001')"
              >{{ t('map.map001') }}</MapButton
            >
            <MapButton
              :active="cacheMapId === 'map002'"
              :disabled="isLoading"
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
        {{ targetMapId ? t(`map.${targetMapId}`) : t(`map.${cacheMapId}`) }}
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
        <span v-if="isLoading">{{ loadingStage }}</span>
        <span v-else>{{ t('header.map_change') }}</span>
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
        v-if="isLoading"
        class="absolute bottom-3 flex h-3 gap-0.5 overflow-hidden"
        :animate="{
          width: '8rem',
        }"
        :transition="{
          duration: 0.5,
          type: 'spring',
          bounce: 0.3,
        }"
        :initial="{
          width: 0,
        }"
      >
        <div class="bg-[#FDFB72] h-1 flex-1 mt-1 loading-bar"></div>
      </motion.div>
      <motion.div
        v-else
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
import { cacheMapId, selectMap } from '@/services/MapCore';
import { motion } from 'motion-v';
import { rafTimeout, cancelRafTimeout } from '@/utils/animationTimer';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const showPopover = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({});
const showChangeAnimation = ref(false);
const isLoading = ref(false);
const loadingStage = ref('');
const targetMapId = ref('');
let animationTimerId: number | null = null;

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

async function changeMap(mapId: string) {
  // 如果已经在加载中或者当前地图就是目标地图，则不处理
  if (isLoading.value || cacheMapId.value === mapId) return;

  // 关闭弹窗
  showPopover.value = false;

  // 清除之前的动画计时器
  if (animationTimerId !== null) {
    cancelRafTimeout(animationTimerId);
    animationTimerId = null;
  }

  // 设置目标地图ID
  targetMapId.value = mapId;

  // 先显示动画（立即）
  showChangeAnimation.value = true;
  isLoading.value = true;

  // 使用requestAnimationFrame确保动画已开始渲染
  requestAnimationFrame(async () => {
    try {
      // 异步加载地图数据
      loadingStage.value = t('header.loading_map_data');
      await new Promise(resolve => setTimeout(resolve, 300)); // 给动画一点时间

      // 开始地图加载流程
      await new Promise<void>(resolve => {
        // 这里使用事件监听模式等待地图加载完成
        // 首先定义一个监听函数来接收加载进度更新
        const mapLoadProgressHandler = (event: CustomEvent) => {
          const { stage } = event.detail;
          loadingStage.value = t(`header.${stage}`) || stage;

          // 如果加载完成，移除监听器并解析Promise
          if (stage === 'map_loaded') {
            window.removeEventListener(
              'map-load-progress',
              mapLoadProgressHandler as EventListener
            );
            resolve();
          }
        };

        // 添加监听器
        window.addEventListener(
          'map-load-progress',
          mapLoadProgressHandler as EventListener
        );

        // 开始地图切换
        selectMap(mapId);
      });

      // 地图加载完成后
      loadingStage.value = t('header.map_loaded');

      // 显示完成动画
      await new Promise(resolve => setTimeout(resolve, 500));

      isLoading.value = false;

      // 延迟关闭动画
      animationTimerId = rafTimeout(() => {
        showChangeAnimation.value = false;
        targetMapId.value = '';
        animationTimerId = null;
      }, 1000);
    } catch (error) {
      console.error('地图切换失败:', error);
      loadingStage.value = t('header.map_load_failed');

      // 出错后等待一段时间再关闭动画
      await new Promise(resolve => setTimeout(resolve, 1000));
      isLoading.value = false;
      showChangeAnimation.value = false;
      targetMapId.value = '';
    }
  });
}

onMounted(() => {
  document.addEventListener('click', clickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', clickOutside);
  if (animationTimerId !== null) {
    cancelRafTimeout(animationTimerId);
  }
});
</script>

<style lang="scss" scoped>
@use '../../styles/zmd.scss' as zmd;
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

.loading-bar {
  background: linear-gradient(
    90deg,
    rgba(253, 251, 114, 0.2) 0%,
    rgba(253, 251, 114, 1) 50%,
    rgba(253, 251, 114, 0.2) 100%
  );
  background-size: 200% 100%;
  animation: loading-animation 1.5s infinite;
}

@keyframes loading-animation {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
</style>
