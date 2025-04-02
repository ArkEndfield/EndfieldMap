<template>
  <div
    ref="controls"
    class="fixed left-1/2 md:left-[unset] -translate-x-1/2 md:translate-x-0 md:right-4 bottom-5 md:bottom-[unset] md:top-1/2 md:-translate-y-1/2 z-10 select-none text-white flex flex-row-reverse md:flex-col justify-center gap-2"
  >
    <ZoomButton
      id="zoomIn"
      class="w-4 h-4"
    >
      <PlusIcon
        class="pointer-events-none text-4xl drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]"
      />
    </ZoomButton>
    <RangeInput
      v-model="uiZoomLevel"
      :min="1.8"
      :max="5"
      :step="0.1"
      class="w-18 md:w-auto md:h-18"
      :direction="inputDirection"
      @change="onSlideChange"
    />
    <ZoomButton
      id="zoomOut"
      class="w-4 h-4"
    >
      <MinusIcon
        class="pointer-events-none text-4xl drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]"
      />
    </ZoomButton>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Map } from 'ol';

const props = defineProps<{
  map: Map | null;
  zoomLevel: number; // 添加zoomLevel作为prop
}>();

const emit = defineEmits<{
  (e: 'update:zoomLevel', value: number): void;
}>();

const controls = ref<HTMLElement>();
const zoomLevel = ref(props.zoomLevel || 3);
// 新增UI专用缩放等级变量，用于平滑显示
const uiZoomLevel = ref(props.zoomLevel || 3);
const inputDirection = ref<'vertical' | 'horizontal'>('vertical');

// 添加动画帧ID变量用于管理动画
let animationFrameId: number | null = null;
// 添加标志变量，用于标记是否是由内部点击按钮触发的缩放变化
let isInternalZoomChange = false;

// 媒体查询匹配器
let mediaQueryList: MediaQueryList | null = null;

// 媒体查询回调函数
const handleMediaQueryChange = (e: MediaQueryListEvent | MediaQueryList) => {
  // 当媒体查询状态变化时，更新方向
  inputDirection.value = e.matches ? 'vertical' : 'horizontal';
};

onMounted(() => {
  // 检测当前屏幕是否匹配md断点
  mediaQueryList = window.matchMedia('(min-width: 768px)'); // 768px是md断点

  // 初始化方向
  inputDirection.value = mediaQueryList.matches ? 'vertical' : 'horizontal';

  // 监听屏幕大小变化
  mediaQueryList.addEventListener('change', handleMediaQueryChange);

  // 监听zoomLevel prop的变化
  watch(
    () => props.zoomLevel,
    newValue => {
      if (newValue !== undefined && newValue !== zoomLevel.value) {
        zoomLevel.value = newValue;

        // 如果是内部触发的缩放变化，不要再更新UI值，避免跳跃
        if (isInternalZoomChange) {
          // 内部点击按钮已处理UI动画，不需要再次更新
          return;
        }

        // 外部传入的缩放变化，使用缓动动画平滑更新UI值
        // 只有当差值超过阈值时才平滑过渡，否则直接赋值
        if (Math.abs(uiZoomLevel.value - newValue) > 0.8) {
          // 缓慢过渡到目标值，避免UI跳变
          animateZoomChange(newValue);
        } else {
          // 小幅度变化，直接更新UI值
          uiZoomLevel.value = newValue;
        }
      }
    },
    { immediate: true }
  );

  // 添加控件点击事件监听
  if (controls.value) {
    controls.value.addEventListener('click', e => {
      if (!props.map) return;

      const target = e.target as HTMLElement;
      const view = props.map.getView();
      const zoom = view?.getZoom() || 0;

      // 使用closest方法找到最近的按钮元素
      const zoomInButton = target.closest('#zoomIn');
      const zoomOutButton = target.closest('#zoomOut');

      if (zoomInButton && view) {
        view.cancelAnimations(); // 取消之前的动画
        const newZoom = zoom + 1 <= 5 ? zoom + 1 : 5;

        // 标记为内部缩放变化，防止props变化时重复更新UI
        isInternalZoomChange = true;

        view.animate({ zoom: newZoom, duration: 400 });

        // 先更新zoomLevel
        zoomLevel.value = newZoom;
        emit('update:zoomLevel', newZoom);

        // 平滑更新UI值，防止连续点击时的跳动
        animateZoomChange(newZoom);

        // 设置一个定时器，在动画完成后重置标志
        setTimeout(() => {
          isInternalZoomChange = false;
        }, 600); // 比动画时长稍长一些，确保props已经完全更新
      } else if (zoomOutButton && view) {
        view.cancelAnimations(); // 取消之前的动画
        const newZoom = zoom - 1 >= 0 ? zoom - 1 : 0;

        // 标记为内部缩放变化，防止props变化时重复更新UI
        isInternalZoomChange = true;

        view.animate({ zoom: newZoom, duration: 400 });

        // 先更新zoomLevel
        zoomLevel.value = newZoom;
        emit('update:zoomLevel', newZoom);

        // 平滑更新UI值，防止连续点击时的跳动
        animateZoomChange(newZoom);

        // 设置一个定时器，在动画完成后重置标志
        setTimeout(() => {
          isInternalZoomChange = false;
        }, 600); // 比动画时长稍长一些，确保props已经完全更新
      }
    });
  }
});

// 平滑动画缩放级别变化
const animateZoomChange = (targetZoom: number) => {
  // 如果动画正在进行中，取消它
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  const startZoom = uiZoomLevel.value;
  const startTime = performance.now();
  const duration = 400; // 与OpenLayers动画持续时间一致

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用缓动函数使动画更自然
    const easeProgress = easeOutCubic(progress);

    // 计算当前动画帧的缩放值
    uiZoomLevel.value = startZoom + (targetZoom - startZoom) * easeProgress;

    // 如果动画未完成，继续请求下一帧
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(step);
    } else {
      // 动画完成，确保最终值精确匹配目标值
      uiZoomLevel.value = targetZoom;
      animationFrameId = null;
    }
  };

  // 开始动画 - 修复：不要重新声明变量，而是使用外部声明的变量
  animationFrameId = requestAnimationFrame(step);
};

// 缓动函数 - 三次方缓出
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

// 组件卸载前移除事件监听器，防止内存泄漏
onBeforeUnmount(() => {
  if (mediaQueryList) {
    mediaQueryList.removeEventListener('change', handleMediaQueryChange);
  }
});

// 滑块改变时的处理函数
const onSlideChange = (newValue: number) => {
  if (!props.map) return;

  // 标记为内部缩放变化，防止props变化时重复更新UI
  isInternalZoomChange = true;

  const view = props.map.getView();
  view?.cancelAnimations(); // 取消之前的动画
  view?.setZoom(newValue);

  // 在这里立即更新两个值，因为这是用户直接操作滑块
  zoomLevel.value = newValue;
  uiZoomLevel.value = newValue;
  emit('update:zoomLevel', newValue);

  // 设置一个定时器，在操作完成后重置标志
  setTimeout(() => {
    isInternalZoomChange = false;
  }, 600); // 给足够的时间确保props已经完全更新
};

defineExpose({
  controls,
});
</script>
