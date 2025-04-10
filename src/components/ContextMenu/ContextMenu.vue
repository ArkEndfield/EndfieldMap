<template>
  <Teleport to="body">
    <div
      ref="scope"
      class="fixed z-50 top-0 left-0 min-w-40 p-1 rounded-lg shadow-lg bg-[#282828] text-white border border-[#FDFB72] origin-top-left"
      @contextmenu.prevent
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useAnimate } from 'motion-v';
import { watch } from 'vue';
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const modelValue = defineModel('modelValue', {
  type: Boolean,
  default: false,
});

const emit = defineEmits(['close']);

const x = ref(0);
const y = ref(0);
const [scope, animate] = useAnimate();

const showMenuAnimate = async () => {
  const el = scope.value;
  if (el) {
    await animate(
      el,
      {
        x: x.value,
        y: y.value,
      },
      {
        duration: 0,
      }
    );
    await animate(
      el,
      {
        opacity: 1,
        scale: 1,
        display: 'block',
      },
      {
        duration: 0.2,
        type: 'spring',
      }
    );
  }
};

const hideMenuAnimate = async () => {
  const el = scope.value;
  if (el) {
    await animate(
      el,
      {
        opacity: 0,
        scale: 0.6,
        display: 'none',
      },
      {
        duration: 0.3,
        type: 'spring',
      }
    );
  }
};

// 显示菜单
const showMenu = async (event: MouseEvent) => {
  event.preventDefault();
  x.value = event.clientX;
  y.value = event.clientY;
  if (modelValue.value) {
    await hideMenuAnimate();
    await showMenuAnimate();
  } else {
    modelValue.value = true;
  }

  // 确保菜单在视口内显示
  nextTick(() => {
    const el = scope.value;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let newX = x.value;
    let newY = y.value;

    // 检查是否超出左边界
    if (rect.left < 0) {
      newX = 0;
    }

    // 检查是否超出上边界
    if (rect.top < 0) {
      newY = 0;
    }

    // 检查是否超出右边界
    if (rect.right > windowWidth) {
      newX = windowWidth - rect.width;
    }

    // 检查是否超出下边界
    if (rect.bottom > windowHeight) {
      newY = windowHeight - rect.height;
    }

    // 如果位置有变化，重新设置位置并应用动画
    if (newX !== x.value || newY !== y.value) {
      x.value = newX;
      y.value = newY;

      animate(
        el,
        {
          x: newX,
          y: newY,
        },
        {
          duration: 0.1,
        }
      );
    }
  });
};

// 关闭菜单
const closeMenu = () => {
  modelValue.value = false;
  emit('close');
};

watch(
  modelValue,
  newValue => {
    if (newValue) {
      showMenuAnimate();
    } else {
      hideMenuAnimate();
    }
  },
  { immediate: true }
);

// 暴露方法
defineExpose({
  showMenu,
  closeMenu,
});

// 点击其他区域关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (
    modelValue.value &&
    scope.value &&
    !scope.value.contains(event.target as Node)
  ) {
    closeMenu();
  }
};

// 按下ESC键关闭菜单
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && modelValue.value) {
    closeMenu();
  }
};

onMounted(() => {
  if (modelValue.value) {
    showMenuAnimate();
  } else {
    hideMenuAnimate();
  }
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', closeMenu);
  window.addEventListener('scroll', closeMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', closeMenu);
  window.removeEventListener('scroll', closeMenu);
});
</script>

<style lang="scss" scoped>
.menu-item {
  @apply flex items-center px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700;
}

.menu-divider {
  @apply my-1 border-t border-gray-200 dark:border-gray-700;
}
</style>
