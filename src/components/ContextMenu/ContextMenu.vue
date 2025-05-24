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
import { ref, onMounted, onUnmounted } from 'vue';

const modelValue = defineModel('modelValue', {
  type: Boolean,
  default: false,
});

const emit = defineEmits(['close']);

const x = ref(0);
const y = ref(0);
const [scope, animate] = useAnimate();
const fakeEl = ref<HTMLDivElement | null>(null);

const showMenuAnimate = async () => {
  const el = scope.value as HTMLDivElement;
  if (el) {
    el.style.translate = `${x.value}px ${y.value}px`;
    el.style.display = 'block';
    await animate(
      el,
      {
        opacity: 1,
        scale: 1,
      },
      {
        duration: 0.2,
        type: 'spring',
      },
    );
  }
};

const hideMenuAnimate = async () => {
  const el = scope.value as HTMLDivElement;
  if (el) {
    const fel = fakeEl.value;
    if (fel) {
      fakeEl.value = null;
      document.body.append(fel);
      const anim = fel.animate([
        {
          transform: 'scale(0.6)',
          easing: 'ease-out',
        },
      ], {
        duration: 80,
      });
      anim.onfinish = () => {
        fel.remove();
      };
    }
    el.style.display = 'none';
    await animate(
      el,
      {
        opacity: 0,
        scale: 0.6,
      },
      {
        duration: 0.001,
      },
    );
  }
};

// 显示菜单
const showMenu = async (event?: MouseEvent) => {
  if (event) {
    event.preventDefault();
    x.value = event.clientX;
    y.value = event.clientY;
  }

  if (modelValue.value) {
    await hideMenuAnimate();
  }

  modelValue.value = true;
  const el = scope.value as HTMLDivElement;

  // 预渲染用于边界检查，此node也用于关闭动画
  const fel = el.cloneNode(true) as HTMLDivElement;
  fakeEl.value = fel;
  fel.style.display = 'block';
  fel.style.transform = 'none';
  fel.style.opacity = '1';
  fel.style.translate = `${x.value}px ${y.value}px`;
  document.body.append(fel);
  const rect = fel.getBoundingClientRect();
  fel.remove();

  // 边界检查
  if (el) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const transformOrigin = ['top', 'left'];
    // 检查是否超出右边界
    if (x.value + rect.width > windowWidth) {
      x.value = x.value - rect.width;
      transformOrigin[1] = 'right';
    }

    // 检查是否超出下边界
    if (y.value + rect.height > windowHeight) {
      y.value = y.value - rect.height;
      transformOrigin[0] = 'bottom';
    }

    // 检查是否超出左边界
    if (x.value < 0) {
      x.value = 0;
    }

    // 检查是否超出上边界
    if (y.value < 0) {
      y.value = 0;
    }

    // 应用新的位置
    el.style.translate = fel.style.translate = `${x.value}px ${y.value}px`;
    el.style.transformOrigin = fel.style.transformOrigin = transformOrigin.join(' ');
  }
  showMenuAnimate();
};

// 关闭菜单
const closeMenu = () => {
  modelValue.value = false;
  emit('close');
};

watch(
  modelValue,
  newValue => {
    const el = scope.value as HTMLDivElement;
    const isShow = el?.style.display !== 'none';

    if (newValue) {
      if (!isShow) {
        showMenu();
      }
    } else if (isShow) {
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

<style lang="scss" scoped></style>
