<template>
  <div
    class="range-input-container items-center flex justify-stretch"
    :class="{
      'flex-col': direction === 'vertical',
    }"
  >
    <div
      class="flex items-center gap-3 w-full"
      :class="{ 'flex-col h-full': direction === 'vertical' }"
    >
      <!-- 滑块容器 - 垂直模式时会旋转 -->
      <div
        :class="[
          'slider-outer-container relative',
          direction === 'vertical' ? 'vertical-container' : 'flex-1',
        ]"
        :style="containerStyle"
        ref="containerRef"
      >
        <div
          class="absolute -left-4 md:left-[unset] md:top-0 rotate-90 md:rotate-0 flex items-center gap-0.5"
        >
          <span
            class="h-0.5 w-1 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"
          ></span>
          <span
            class="h-1 w-2.5 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"
          ></span>
          <span
            class="h-0.5 w-1 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"
          ></span>
        </div>
        <div
          class="absolute -right-4 md:right-[unset] md:bottom-0 rotate-90 md:rotate-0 flex items-center gap-0.5"
        >
          <span
            class="h-0.5 w-1 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"
          ></span>
          <span
            class="h-1 w-2.5 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"
          ></span>
          <span
            class="h-0.5 w-1 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"
          ></span>
        </div>
        <!-- 滑块轨道和手柄 - 始终使用水平布局，但在垂直模式时会被旋转 -->
        <div
          ref="trackRef"
          class="slider-track-container bg-[#ffff9b6a] shadow-[0_0_0.1em_rgba(253,251,84,0.8)] h-1 relative"
          @click="handleTrackClick"
        >
          <!-- 已选择部分的填充 -->
          <div
            class="absolute h-full bg-[#FDFB54]"
            :style="{
              width: `${percentage > 0 ? percentage : 0}%`,
              left: props.direction === 'vertical' ? 'auto' : '0',
              right: props.direction === 'vertical' ? '0' : 'auto',
            }"
          ></div>

          <!-- 滑块手柄 -->
          <div
            class="absolute h-2 w-2 bg-[#FDFB54] shadow-[0_0_0.1em_rgba(253,251,84,0.8)] transform hover:scale-110 transition-transform -top-0.5 -translate-x-1/2 rotate-45 slider-handle"
            :style="{
              left:
                props.direction === 'vertical'
                  ? `${percentage > 0 ? 100 - percentage : 100}%`
                  : `${percentage > 0 ? percentage : 0}%`,
            }"
            @mousedown="startDrag"
            @touchstart="startDrag"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

// 使用 defineModel 实现双向绑定
const modelValue = defineModel<number>({ required: true });

// Props 定义
const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    format?: (value: number) => string;
    direction?: 'horizontal' | 'vertical';
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    format: (value: number) => value.toString(),
    direction: 'horizontal',
  }
);

// 事件
const emit = defineEmits(['update:modelValue', 'change']);

// 引用和状态
const trackRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const containerHeight = ref(0);
const containerWidth = ref(0);
const resizeObserver = ref<ResizeObserver | null>(null);

// 容器样式计算属性
const containerStyle = computed(() => {
  if (props.direction === 'vertical') {
    return {
      height: containerRef.value?.parentElement?.style.height || '100%',
      minHeight: '100px',
      flexGrow: '1',
    };
  }
  return {};
});

// 计算属性
const percentage = computed(() => {
  return ((modelValue.value - props.min) / (props.max - props.min)) * 100;
});

// 更新滑块尺寸和位置
const updateSlider = async () => {
  if (!containerRef.value || !trackRef.value) return;

  // 等待DOM更新
  await nextTick();

  // 获取容器尺寸
  containerHeight.value = containerRef.value.clientHeight;
  containerWidth.value = containerRef.value.clientWidth;

  if (props.direction === 'vertical' && containerHeight.value > 0) {
    // 检查父元素的高度
    const parent = containerRef.value.parentElement;
    if (parent) {
      // 设置容器高度为100%
      containerRef.value.style.height = '100%';
    }

    // 设置轨道宽度为容器高度减去一定边距
    const trackSize = Math.max(containerHeight.value - 24, 80);
    trackRef.value.style.width = `${trackSize}px`;
  } else {
    // 水平模式
    trackRef.value.style.width = '100%';
  }
};

// 方法
const setValue = (clientX: number, clientY: number) => {
  if (!trackRef.value || props.disabled) return;

  const rect = trackRef.value.getBoundingClientRect();
  let percentage: number;

  if (props.direction === 'horizontal') {
    percentage = (clientX - rect.left) / rect.width;
  } else {
    // 垂直方向，从下往上增加（反转计算）
    percentage = 1 - (clientY - rect.top) / rect.height;
  }

  percentage = Math.max(0, Math.min(1, percentage));

  // 计算新值并应用步长
  let newValue = props.min + percentage * (props.max - props.min);
  newValue = Math.round(newValue / props.step) * props.step;
  newValue = Math.max(props.min, Math.min(props.max, newValue));

  // 更新模型值
  modelValue.value = newValue;
  emit('change', newValue);
};

const handleTrackClick = (event: MouseEvent) => {
  setValue(event.clientX, event.clientY);
};

const startDrag = (event: MouseEvent | TouchEvent) => {
  if (props.disabled) return;

  event.preventDefault();
  isDragging.value = true;

  // 监听移动和结束事件
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('touchmove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);
};

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;

  let clientX, clientY;

  if ('touches' in event) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  setValue(clientX, clientY);
};

const stopDrag = () => {
  isDragging.value = false;

  // 移除事件监听
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchend', stopDrag);
};

// 组件挂载和卸载时的生命周期钩子
onMounted(async () => {
  // 确保初始值在范围内并且符合步长
  if (modelValue.value < props.min) modelValue.value = props.min;
  if (modelValue.value > props.max) modelValue.value = props.max;

  const steppedValue = Math.round(modelValue.value / props.step) * props.step;
  if (steppedValue !== modelValue.value) {
    modelValue.value = steppedValue;
  }

  // 初始化滑块
  updateSlider();

  // 监听窗口大小变化
  window.addEventListener('resize', updateSlider);

  // 创建MutationObserver监听容器属性变化（比如样式变化）
  const observer = new MutationObserver(() => {
    updateSlider();
  });

  if (containerRef.value) {
    observer.observe(containerRef.value, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }

  // 创建ResizeObserver监听容器大小变化
  resizeObserver.value = new ResizeObserver(() => {
    updateSlider();
  });

  if (containerRef.value) {
    resizeObserver.value.observe(containerRef.value);

    // 同时监听父元素
    if (containerRef.value.parentElement) {
      resizeObserver.value.observe(containerRef.value.parentElement);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchend', stopDrag);
  window.removeEventListener('resize', updateSlider);

  // 清理ResizeObserver
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }
});

// 监听direction变化
watch(() => props.direction, updateSlider);

// 监听容器高度变化
watch(
  [containerHeight, containerWidth],
  ([newHeight, newWidth], [oldHeight, oldWidth]) => {
    if (newHeight !== oldHeight || newWidth !== oldWidth) {
      updateSlider();
    }
  }
);
</script>

<style lang="scss" scoped>
.range-input-container {
  @apply w-full py-2;

  &:hover {
    .track {
      @apply bg-gray-300;
    }
  }
}

/* 垂直滑块样式 */
.vertical-container {
  position: relative;
  width: 2rem; /* 设置固定宽度 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0; /* 添加内边距，确保手柄有足够空间 */
  flex-grow: 1;
  height: 100% !important; /* 强制占满父容器高度 */

  .slider-track-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(90deg);
    transform-origin: center center;
  }
}

.slider-outer-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%; /* 确保占满高度 */
  position: relative;
}

// 垂直模式下确保所有父元素都传递高度
.range-input-container.flex-col {
  height: 100%;
  display: flex;
  flex-direction: column;

  > div.flex-col {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
}

/* 禁用状态样式 */
:deep(.disabled) {
  @apply opacity-50 cursor-not-allowed;
}

/* 滑块手柄两侧箭头效果 */
.slider-handle {
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 0.5em;
    height: 1em;
    background-color: #fdfb546a;
    rotate: 225deg;
    transform: translateY(-50%);
    z-index: -1;
  }

  /* 左侧箭头 */
  &::before {
    left: 0%;
    top: -190%;
    $clip-path: polygon(
      0 0,
      100% 50%,
      0 100%,
      0 calc(100% - 0.25em),
      calc(100% - 0.25em) 50%,
      0 0.25em
    );
    -webkit-clip-path: $clip-path;
    clip-path: $clip-path;
  }

  /* 右侧箭头 */
  &::after {
    right: -140%;
    top: -50%;
    $clip-path: polygon(
      100% 0,
      0 50%,
      100% 100%,
      100% calc(100% - 0.25em),
      0.25em 50%,
      100% 0.25em
    );
    -webkit-clip-path: $clip-path;
    clip-path: $clip-path;
  }
}
</style>
