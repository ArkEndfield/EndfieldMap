<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="fixed z-50 min-w-40 p-1 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      :style="{ top: `${y}px`, left: `${x}px` }"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'close']);

const visible = ref(props.modelValue);
const x = ref(0);
const y = ref(0);
const menuRef = ref<HTMLElement | null>(null);

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  newVal => {
    visible.value = newVal;
  }
);

// 显示菜单
const showMenu = (event: MouseEvent) => {
  event.preventDefault();
  x.value = event.clientX;
  y.value = event.clientY;
  visible.value = true;
  emit('update:modelValue', true);

  // 确保菜单在视口内显示
  nextTick(() => {
    if (!menuRef.value) return;

    const menu = menuRef.value;
    const rect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 检查是否超出右边界
    if (rect.right > windowWidth) {
      x.value = windowWidth - rect.width;
    }

    // 检查是否超出下边界
    if (rect.bottom > windowHeight) {
      y.value = windowHeight - rect.height;
    }
  });
};

// 关闭菜单
const closeMenu = () => {
  visible.value = false;
  emit('update:modelValue', false);
  emit('close');
};

// 暴露方法
defineExpose({
  showMenu,
  closeMenu,
});

// 点击其他区域关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (
    visible.value &&
    menuRef.value &&
    !menuRef.value.contains(event.target as Node)
  ) {
    closeMenu();
  }
};

// 按下ESC键关闭菜单
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && visible.value) {
    closeMenu();
  }
};

onMounted(() => {
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
