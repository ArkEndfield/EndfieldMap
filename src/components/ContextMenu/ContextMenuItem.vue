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
    @click="handleClick"
  >
    <span
      v-if="$slots.icon"
      class="w-5 flex justify-center items-center"
    >
      <slot name="icon"> </slot>
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
// defineProps({
//   label: {
//     type: String,
//     default: '',
//   },
//   icon: {
//     type: String,
//     default: '',
//   },
//   shortcut: {
//     type: String,
//     default: '',
//   },
//   disabled: {
//     type: Boolean,
//     default: false,
//   },
//   className: {
//     type: String,
//     default: '',
//   },
//   onClick: {
//     type: Function,
//     default: null,
//   },
// });
const props = withDefaults(
  defineProps<{
    label: string;
    shortcut?: string;
    disabled?: boolean;
    className?: string;
  }>(),
  {
    disabled: false,
    className: '',
    shortcut: '',
  }
);

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const handleClick = () => {
  if (props.disabled) return;
  emit('click');
};
</script>

<style lang="scss" scoped></style>
