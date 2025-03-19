<template>
  <div
    class="relative flex items-center w-full border border-gray-300 rounded-full transition-colors text-sm focus-within:border-zinc-700"
    :class="
      cn({
        'pl-10': !$slots.icon,
      })
    "
  >
    <div
      v-if="$slots.icon"
      class="flex items-center text-xl justify-center pointer-events-none w-10 shrink-0 grow-0 h-full"
    >
      <slot name="icon" />
    </div>
    <input
      :type="props.type"
      :value="modelValue"
      v-model="modelValue"
      class="w-full py-2 focus:outline-none"
      :class="cn({ 'pr-4': !$slots.button })"
      v-bind="$attrs"
    />
    <div
      v-if="$slots.button"
      ref="buttonRef"
      class="h-full flex items-center grow-0 shrink-0"
    >
      <div class="h-4 w-px mx-2 shrink-0 grow-0"></div>
      <div
        class="flex items-center justify-center px-3 mr-2 h-full cursor-pointer hover:text-zinc-600"
        @click="$emit('button-click')"
      >
        <slot name="button"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/tailwind';
import { ref, onMounted } from 'vue';
const props = withDefaults(
  defineProps<{
    type?: string;
  }>(),
  {
    type: 'text',
  }
);
const modelValue = defineModel<string>({ default: '' });

const buttonRef = ref<HTMLElement | null>(null);
const buttonWidth = ref(0);

onMounted(() => {
  if (buttonRef.value) {
    buttonWidth.value = buttonRef.value.offsetWidth;
  }
});

defineEmits(['button-click']);
</script>

<style lang="scss" scoped>
/* 移除之前的 :has 伪类选择器样式 */
</style>
