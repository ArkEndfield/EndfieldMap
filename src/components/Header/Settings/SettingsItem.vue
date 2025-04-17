<template>
  <div
    :class="
      cn(
        'border-2 flex gap-2 items-stretch',
        props.danger
          ? 'border-red-500 text-red-500'
          : 'border-[#272727] text-[#272727]'
      )
    "
  >
    <div class="shrink-0 py-2 pl-2 flex items-center justify-center">
      <slot name="before"></slot>
    </div>
    <div class="flex-1 py-2">
      <div><slot></slot></div>
      <div class="text-xs"><slot name="description"></slot></div>
    </div>
    <div
      @click="endClick"
      :class="
        cn(
          'ml-auto shrink-0 w-24 flex justify-center items-center px-2',
          props.danger ? 'bg-red-500/15' : 'bg-zinc-400/15'
        )
      "
    >
      <slot
        name="loading"
        v-if="props.loading"
      >
        <div
          class="w-5 h-5 border-1 border-zinc-400 rounded-full relative box-border animate-spin mx-auto"
        >
          <div
            class="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full border-2 border-transparent border-t-zinc-600"
          ></div>
        </div>
      </slot>
      <slot
        name="after"
        v-if="!props.loading"
      ></slot>
    </div>
  </div>
  <ZmdAlertFull
    :open="showError"
    hide-cancel
    @confirm="closeError"
  >
    <div class="text-red-500 flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      ></svg>
      <span>{{ props.error?.message }}</span>
    </div>
  </ZmdAlertFull>
</template>

<script setup lang="ts">
import { cn } from '@/utils/tailwind';
import { watch } from 'vue';
import { ref } from 'vue';
const showError = ref(false);
const props = withDefaults(
  defineProps<{
    danger?: boolean;
    loading?: boolean;
    disabled?: boolean;
    error?: Error | null;
  }>(),
  {
    danger: false,
    loading: false,
    disabled: false,
    error: null,
  }
);

const emit = defineEmits<{
  (e: 'endClick'): void;
}>();

const endClick = () => {
  if (!props.loading && !props.disabled) emit('endClick');
};

const closeError = () => {
  showError.value = false;
};

watch(
  () => props.error,
  newVal => {
    showError.value = !!newVal;
  }
);
</script>

<style lang="scss" scoped></style>
