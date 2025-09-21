<template>
  <div
    ref="controls"
    class="fixed left-1/2 md:left-[unset] -translate-x-1/2 md:translate-x-0 md:right-4 bottom-6 md:bottom-[unset] md:top-1/2 md:-translate-y-1/2 z-10 select-none text-white flex flex-row-reverse md:flex-col justify-center gap-2"
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
      v-model="zoomLevel"
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
const zoomLevel = ref(props.zoomLevel);
const inputDirection = ref<'vertical' | 'horizontal'>('vertical');

// 媒体查询匹配器
let mediaQueryList: MediaQueryList | null = null;
// 地图视图监听器
let viewChangeListener: (() => void) | null = null;

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
      }
    },
    { immediate: true }
  );

  // 监听地图变化，重新设置视图监听器
  watch(
    () => props.map,
    (newMap) => {
      // 先移除旧的监听器
      if (props.map && viewChangeListener) {
        const oldView = props.map.getView();
        oldView.un('change:resolution', viewChangeListener);
      }
      
      // 设置新的监听器
      if (newMap) {
        const view = newMap.getView();
        viewChangeListener = () => {
          const currentZoom = view.getZoom();
          if (currentZoom !== undefined && currentZoom !== zoomLevel.value) {
            zoomLevel.value = currentZoom;
            emit('update:zoomLevel', currentZoom);
          }
        };
        view.on('change:resolution', viewChangeListener);
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

        view.animate({ zoom: newZoom, duration: 400 });

        // 先更新zoomLevel
        zoomLevel.value = newZoom;
        emit('update:zoomLevel', newZoom);
      } else if (zoomOutButton && view) {
        view.cancelAnimations(); // 取消之前的动画
        const newZoom = zoom - 1 >= 0 ? zoom - 1 : 0;

        view.animate({ zoom: newZoom, duration: 400 });

        // 先更新zoomLevel
        zoomLevel.value = newZoom;
        emit('update:zoomLevel', newZoom);
      }
    });
  }
});

// 组件卸载前移除事件监听器，防止内存泄漏
onBeforeUnmount(() => {
  if (mediaQueryList) {
    mediaQueryList.removeEventListener('change', handleMediaQueryChange);
  }
  
  // 移除地图视图监听器
  if (props.map && viewChangeListener) {
    const view = props.map.getView();
    view.un('change:resolution', viewChangeListener);
  }
});

// 滑块改变时的处理函数
const onSlideChange = (newValue: number) => {
  if (!props.map) return;

  const view = props.map.getView();
  view?.cancelAnimations(); // 取消之前的动画
  view?.setZoom(newValue);

  // 在这里立即更新两个值，因为这是用户直接操作滑块
  zoomLevel.value = newValue;
  emit('update:zoomLevel', newValue);
};

defineExpose({
  controls,
});
</script>
