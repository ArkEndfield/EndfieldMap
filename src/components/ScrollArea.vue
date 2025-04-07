<template>
  <div
    ref="scrollAreaRef"
    class="scroll-area"
    :class="{
      'h-scrollable': showHorizontalScroll,
      'v-scrollable': showVerticalScroll,
      scrolling: isScrolling,
      'touch-scrolling': isTouchScrolling,
      'flex-container': flexContainer,
      'natural-scrolling': true,
    }"
    :style="containerStyle"
  >
    <div
      ref="contentRef"
      class="scroll-content"
      :class="[props.contentClass, { 'flex-content': flexContainer }]"
      @scroll="handleScroll"
    >
      <slot />
    </div>
    <!-- 垂直滚动条 -->
    <div
      v-show="showVerticalScroll"
      class="scrollbar vertical-scrollbar"
      :class="{ active: isVerticalScrollbarActive }"
      :style="verticalTrackStyle"
      @mousedown="clickVerticalTrack"
    >
      <motion.div
        ref="vThumbRef"
        class="scrollbar-thumb vertical-thumb"
        :class="{ dragging: verticalDragging }"
        :animate="verticalThumbStyle"
        @mousedown.stop="startVerticalDrag"
        :transition="{
          delay: 0,
          duration: 0.2,
          type: 'spring',
        }"
      />
    </div>
    <!-- 水平滚动条 -->
    <div
      v-show="showHorizontalScroll"
      class="scrollbar horizontal-scrollbar"
      :class="{ active: isHorizontalScrollbarActive }"
      :style="horizontalTrackStyle"
      @mousedown="clickHorizontalTrack"
      :transition="{
        delay: 0,
        duration: 0.2,
        type: 'spring',
      }"
    >
      <motion.div
        ref="hThumbRef"
        class="scrollbar-thumb horizontal-thumb"
        :class="{ dragging: horizontalDragging }"
        :animate="horizontalThumbStyle"
        @mousedown.stop="startHorizontalDrag"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { motion } from 'motion-v';
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';

interface Props {
  width?: string;
  height?: string;
  thumbColor?: string;
  trackColor?: string;
  thumbSize?: number; // 滚动条尺寸比例，默认为1
  scrollbarSize?: number; // 滚动条宽度（像素）
  scrollbarMargin?: number; // 滚动条边距（像素）
  contentClass?: string | string[] | Record<string, boolean>; // 内容区域的自定义类名
  smoothScrolling?: boolean; // 是否启用平滑滚动
  smoothScrollDuration?: number; // 平滑滚动持续时间(ms)
  scrollbarFadeDelay?: number; // 滚动条淡出延迟(ms)
  flexContainer?: boolean; // 是否作为flex容器使用，解决flex布局中的滚动问题
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '100%',
  thumbColor: '#FCFEFE',
  trackColor: 'rgba(0, 0, 0, 0.2)',
  thumbSize: 1,
  scrollbarSize: 4,
  scrollbarMargin: 2,
  smoothScrolling: true,
  smoothScrollDuration: 150,
  scrollbarFadeDelay: 1000,
  flexContainer: false,
});

// 引用元素
const scrollAreaRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const vThumbRef = ref<HTMLElement | null>(null);
const hThumbRef = ref<HTMLElement | null>(null);

// 滚动状态
const showVerticalScroll = ref(false);
const showHorizontalScroll = ref(false);
const scrollTop = ref(0);
const scrollLeft = ref(0);
const contentHeight = ref(0);
const contentWidth = ref(0);
const viewportHeight = ref(0);
const viewportWidth = ref(0);
const verticalThumbHeight = ref(0);
const horizontalThumbWidth = ref(0);
const isScrolling = ref(false);
const isVerticalScrollbarActive = ref(false);
const isHorizontalScrollbarActive = ref(false);
const isTouchScrolling = ref(false);
const scrollingTimeout = ref<number | null>(null);
const scrollbarFadeTimeout = ref<number | null>(null);

// 拖动状态
const verticalDragging = ref(false);
const horizontalDragging = ref(false);
const startClientY = ref(0);
const startClientX = ref(0);
const startScrollTop = ref(0);
const startScrollLeft = ref(0);

// 样式计算
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
}));

const verticalTrackStyle = computed(() => ({
  backgroundColor: props.trackColor,
  width: `${props.scrollbarSize}px`,
  right: `${props.scrollbarMargin}px`,
  borderRadius: `${props.scrollbarSize / 2}px`,
}));

const horizontalTrackStyle = computed(() => ({
  backgroundColor: props.trackColor,
  height: `${props.scrollbarSize}px`,
  bottom: `${props.scrollbarMargin}px`,
  borderRadius: `${props.scrollbarSize / 2}px`,
}));

// 修改垂直滚动条位置的计算逻辑，避免 NaN
const verticalThumbStyle = computed(() => {
  // 计算垂直滚动条位置，并确保值有效
  let topPosition = 0;
  if (contentHeight.value > viewportHeight.value) {
    const maxScroll = contentHeight.value - viewportHeight.value;
    const maxThumbPosition = viewportHeight.value - verticalThumbHeight.value;
    // 确保没有除以0的情况，并且结果为有效数字
    if (maxScroll > 0 && maxThumbPosition > 0) {
      topPosition = (scrollTop.value / maxScroll) * maxThumbPosition;
    }
  }

  return {
    backgroundColor: props.thumbColor,
    height: `${verticalThumbHeight.value}px`,
    width: `${props.scrollbarSize * props.thumbSize}px`,
    left: `${(props.scrollbarSize * (1 - props.thumbSize)) / 2}px`,
    top: `${topPosition}px`,
    borderRadius: `${props.scrollbarSize / 2}px`,
  };
});

// 修改水平滚动条位置的计算逻辑，避免 NaN
const horizontalThumbStyle = computed(() => {
  // 计算水平滚动条位置，并确保值有效
  let leftPosition = 0;
  if (contentWidth.value > viewportWidth.value) {
    const maxScroll = contentWidth.value - viewportWidth.value;
    const maxThumbPosition = viewportWidth.value - horizontalThumbWidth.value;
    // 确保没有除以0的情况，并且结果为有效数字
    if (maxScroll > 0 && maxThumbPosition > 0) {
      leftPosition = (scrollLeft.value / maxScroll) * maxThumbPosition;
    }
  }

  return {
    backgroundColor: props.thumbColor,
    width: `${horizontalThumbWidth.value}px`,
    height: `${props.scrollbarSize * props.thumbSize}px`,
    top: `${(props.scrollbarSize * (1 - props.thumbSize)) / 2}px`,
    left: `${leftPosition}px`,
    borderRadius: `${props.scrollbarSize / 2}px`,
  };
});

// 防抖函数
const debounce = (fn: Function, delay: number) => {
  let timer: number | null = null;
  return function (...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
};

// 计算滚动条尺寸和可见性
const updateScrollbars = () => {
  if (!contentRef.value || !scrollAreaRef.value) return;

  const content = contentRef.value;
  const viewport = scrollAreaRef.value;

  contentHeight.value = content.scrollHeight;
  contentWidth.value = content.scrollWidth;
  viewportHeight.value = viewport.clientHeight;
  viewportWidth.value = viewport.clientWidth;

  // 计算垂直滚动条的高度和可见性
  showVerticalScroll.value = contentHeight.value > viewportHeight.value;
  if (showVerticalScroll.value) {
    const ratio = viewportHeight.value / contentHeight.value;
    verticalThumbHeight.value = Math.max(30, ratio * viewportHeight.value);
  }

  // 计算水平滚动条的宽度和可见性
  showHorizontalScroll.value = contentWidth.value > viewportWidth.value;
  if (showHorizontalScroll.value) {
    const ratio = viewportWidth.value / contentWidth.value;
    horizontalThumbWidth.value = Math.max(30, ratio * viewportWidth.value);
  }
};

// 平滑滚动动画
const startSmoothScroll = (targetTop: number, targetLeft: number) => {
  if (contentRef.value) {
    contentRef.value.scroll({
      top: targetTop,
      left: targetLeft,
      behavior: 'smooth',
    });
  }
};

// 处理滚动事件
const handleScroll = (e?: Event) => {
  if (!contentRef.value) return;

  // 如果是触摸板事件导致的滚动，不要阻止默认行为
  if (e && e.type === 'wheel' && (e as WheelEvent).deltaMode === 0) {
    // 这是精确滚动（通常是触摸板），不阻止默认行为
    e.stopPropagation(); // 只停止冒泡，但不阻止默认滚动
  }

  scrollTop.value = contentRef.value.scrollTop;
  scrollLeft.value = contentRef.value.scrollLeft;

  // 标记正在滚动
  isScrolling.value = true;
  isVerticalScrollbarActive.value = true;
  isHorizontalScrollbarActive.value = true;

  // 清除之前的超时
  if (scrollingTimeout.value !== null) {
    clearTimeout(scrollingTimeout.value);
  }
  if (scrollbarFadeTimeout.value !== null) {
    clearTimeout(scrollbarFadeTimeout.value);
  }

  // 设置新的超时
  scrollingTimeout.value = window.setTimeout(() => {
    isScrolling.value = false;

    // 设置滚动条淡出超时
    scrollbarFadeTimeout.value = window.setTimeout(() => {
      if (
        !verticalDragging.value &&
        !horizontalDragging.value &&
        !isTouchScrolling.value
      ) {
        isVerticalScrollbarActive.value = false;
        isHorizontalScrollbarActive.value = false;
      }
    }, props.scrollbarFadeDelay);
  }, 150); // 滚动结束后保持滚动状态的时间
};

// 防抖的滚动处理函数，用于频繁触发的滚动事件
const debouncedUpdateScrollbars = debounce(updateScrollbars, 200);

// 垂直滚动条拖动
const startVerticalDrag = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  verticalDragging.value = true;
  isVerticalScrollbarActive.value = true;
  startClientY.value = e.clientY;
  startScrollTop.value = scrollTop.value;

  document.addEventListener('mousemove', handleVerticalDrag);
  document.addEventListener('mouseup', stopVerticalDrag);

  // 添加拖动时的鼠标样式
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
};

const handleVerticalDrag = (e: MouseEvent) => {
  if (!verticalDragging.value || !contentRef.value) return;

  const deltaY = e.clientY - startClientY.value;
  const scrollRatio =
    (contentHeight.value - viewportHeight.value) /
    (viewportHeight.value - verticalThumbHeight.value);
  const newScrollTop = startScrollTop.value + deltaY * scrollRatio;

  // 直接设置滚动位置，不使用动画
  contentRef.value.scrollTop = Math.max(
    0,
    Math.min(contentHeight.value - viewportHeight.value, newScrollTop)
  );
};

const stopVerticalDrag = () => {
  verticalDragging.value = false;

  document.removeEventListener('mousemove', handleVerticalDrag);
  document.removeEventListener('mouseup', stopVerticalDrag);

  // 恢复默认鼠标样式
  document.body.style.userSelect = '';
  document.body.style.cursor = '';

  // 延迟隐藏滚动条
  setTimeout(() => {
    if (
      !isScrolling.value &&
      !horizontalDragging.value &&
      !isTouchScrolling.value
    ) {
      isVerticalScrollbarActive.value = false;
    }
  }, props.scrollbarFadeDelay);
};

// 垂直滚动条轨道点击
const clickVerticalTrack = (e: MouseEvent) => {
  if (!contentRef.value || !scrollAreaRef.value || !vThumbRef.value) return;

  // 阻止默认事件和冒泡
  e.preventDefault();
  e.stopPropagation();

  // 获取点击位置相对于轨道的坐标
  const trackRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const clickY = e.clientY - trackRect.top;

  // 获取滑块当前位置
  const thumbRect = vThumbRef.value.getBoundingClientRect();
  const thumbTop = thumbRect.top - trackRect.top;

  // 判断点击位置是在滑块上方还是下方
  if (clickY < thumbTop) {
    // 点击在滑块上方，向上滚动一页
    const targetScrollTop = Math.max(
      0,
      scrollTop.value - viewportHeight.value * 0.9
    );
    startSmoothScroll(targetScrollTop, scrollLeft.value);
  } else if (clickY > thumbTop + thumbRect.height) {
    // 点击在滑块下方，向下滚动一页
    const maxScrollTop = contentHeight.value - viewportHeight.value;
    const targetScrollTop = Math.min(
      maxScrollTop,
      scrollTop.value + viewportHeight.value * 0.9
    );
    startSmoothScroll(targetScrollTop, scrollLeft.value);
  }
};

// 水平滚动条拖动
const startHorizontalDrag = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  horizontalDragging.value = true;
  isHorizontalScrollbarActive.value = true;
  startClientX.value = e.clientX;
  startScrollLeft.value = scrollLeft.value;

  document.addEventListener('mousemove', handleHorizontalDrag);
  document.addEventListener('mouseup', stopHorizontalDrag);

  // 添加拖动时的鼠标样式
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
};

const handleHorizontalDrag = (e: MouseEvent) => {
  if (!horizontalDragging.value || !contentRef.value) return;

  const deltaX = e.clientX - startClientX.value;
  const scrollRatio =
    (contentWidth.value - viewportWidth.value) /
    (viewportWidth.value - horizontalThumbWidth.value);
  const newScrollLeft = startScrollLeft.value + deltaX * scrollRatio;

  // 直接设置滚动位置，不使用动画
  contentRef.value.scrollLeft = Math.max(
    0,
    Math.min(contentWidth.value - viewportWidth.value, newScrollLeft)
  );
};

const stopHorizontalDrag = () => {
  horizontalDragging.value = false;

  document.removeEventListener('mousemove', handleHorizontalDrag);
  document.removeEventListener('mouseup', stopHorizontalDrag);

  // 恢复默认鼠标样式
  document.body.style.userSelect = '';
  document.body.style.cursor = '';

  // 延迟隐藏滚动条
  setTimeout(() => {
    if (
      !isScrolling.value &&
      !verticalDragging.value &&
      !isTouchScrolling.value
    ) {
      isHorizontalScrollbarActive.value = false;
    }
  }, props.scrollbarFadeDelay);
};

// 水平滚动条轨道点击
const clickHorizontalTrack = (e: MouseEvent) => {
  if (!contentRef.value || !scrollAreaRef.value || !hThumbRef.value) return;

  // 阻止默认事件和冒泡
  e.preventDefault();
  e.stopPropagation();

  // 获取点击位置相对于轨道的坐标
  const trackRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const clickX = e.clientX - trackRect.left;

  // 获取滑块当前位置
  const thumbRect = hThumbRef.value.getBoundingClientRect();
  const thumbLeft = thumbRect.left - trackRect.left;

  // 判断点击位置是在滑块左侧还是右侧
  if (clickX < thumbLeft) {
    // 点击在滑块左侧，向左滚动一页
    const targetScrollLeft = Math.max(
      0,
      scrollLeft.value - viewportWidth.value * 0.9
    );
    startSmoothScroll(scrollTop.value, targetScrollLeft);
  } else if (clickX > thumbLeft + thumbRect.width) {
    // 点击在滑块右侧，向右滚动一页
    const maxScrollLeft = contentWidth.value - viewportWidth.value;
    const targetScrollLeft = Math.min(
      maxScrollLeft,
      scrollLeft.value + viewportWidth.value * 0.9
    );
    startSmoothScroll(scrollTop.value, targetScrollLeft);
  }
};

// 监听内容变化
const resizeObserver = ref<ResizeObserver | null>(null);

onMounted(() => {
  nextTick(() => {
    updateScrollbars();

    // 使用 ResizeObserver 监听内容尺寸变化
    if (contentRef.value) {
      resizeObserver.value = new ResizeObserver(() => {
        updateScrollbars();
      });
      resizeObserver.value.observe(contentRef.value);
    }

    // 监听窗口尺寸变化
    window.addEventListener('resize', debouncedUpdateScrollbars);
  });
});

onUnmounted(() => {
  // 清理监听器
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }

  window.removeEventListener('resize', debouncedUpdateScrollbars);
  document.removeEventListener('mousemove', handleVerticalDrag);
  document.removeEventListener('mouseup', stopVerticalDrag);
  document.removeEventListener('mousemove', handleHorizontalDrag);
  document.removeEventListener('mouseup', stopHorizontalDrag);

  // 清除所有超时和动画
  if (scrollingTimeout.value !== null) {
    clearTimeout(scrollingTimeout.value);
  }
  if (scrollbarFadeTimeout.value !== null) {
    clearTimeout(scrollbarFadeTimeout.value);
  }
});

// 监听 props 变化
watch([() => props.width, () => props.height], () => {
  updateScrollbars();
});
</script>

<style scoped>
.scroll-area {
  position: relative;
  overflow: hidden;
}

.scroll-content {
  height: 100%;
  width: 100%;
  overflow: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  -webkit-overflow-scrolling: touch; /* 支持iOS的惯性滚动 */
}

/* 针对 flex 布局的特殊处理 */
.flex-container {
  display: flex;
  flex-direction: column;
  min-height: 0; /* 关键设置，确保 flex 子项目能够正确约束 */
  flex: 1;
}

.flex-content {
  position: relative;
  min-height: 0; /* 关键设置 */
  height: auto;
  flex: 1;
}

.scrollbar {
  position: absolute;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.h-scrollable .horizontal-scrollbar,
.v-scrollable .vertical-scrollbar {
  opacity: 0;
}

.scrollbar.active,
.scroll-area:hover .scrollbar,
.scrollbar-thumb.dragging {
  opacity: 1;
}

.scrollbar-thumb {
  position: absolute;
  transition: background-color 0.2s ease;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}

.vertical-scrollbar {
  top: 0;
  right: 0;
  height: 100%;
}

.horizontal-scrollbar {
  left: 0;
  bottom: 0;
  width: 100%;
}

/* 滚动中的滚动条样式增强 */
.scrolling .scrollbar-thumb,
.touch-scrolling .scrollbar-thumb {
  opacity: 1;
}

/* 自然滚动模式下的优化 */
.natural-scrolling .scroll-content {
  scroll-behavior: auto;
  will-change: scroll-position;
  overscroll-behavior: contain; /* 防止过度滚动影响父容器 */
}
</style>
