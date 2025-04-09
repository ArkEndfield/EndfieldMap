<template>
  <div
    :class="[
      'flex items-center px-2 py-2 gap-1 text-sm rounded-md',
      {
        'opacity-50': disabled,
        'hover:bg-[#FDFB72]/10': !disabled,
      },
      className,
    ]"
    @click="!disabled && onClick && onClick()"
  >
    <span
      v-if="icon"
      class="w-5 flex justify-center items-center"
    >
      <slot name="icon">
        {{ icon }}
      </slot>
    </span>
    <span>
      <slot>{{ label }}</slot>
    </span>
    <span
      v-if="shortcut"
      class="ml-auto pl-4 text-xs text-gray-500"
    >
      {{ shortcut }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  shortcut: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  className: {
    type: String,
    default: '',
  },
  onClick: {
    type: Function,
    default: null,
  },
});
</script>

<style lang="scss" scoped></style>
