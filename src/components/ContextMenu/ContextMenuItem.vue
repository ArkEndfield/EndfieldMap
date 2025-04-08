<template>
  <div
    :class="[
      'flex items-center px-3 py-2 text-sm rounded-md',
      {
        'opacity-50': disabled,
        'hover:bg-gray-700': !disabled,
      },
      className,
    ]"
    @click="!disabled && onClick && onClick()"
  >
    <span
      v-if="icon"
      class="mr-2"
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
      class="ml-auto pl-4 text-xs text-gray-500 dark:text-gray-400"
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
