<template>
  <div
    class="zmd-sidebar-filter-toggle"
    :class="{ active: isActive }"
    @click="toggle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: undefined,
  },
  checked: {
    type: Boolean,
    default: undefined,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const internalActive = ref(false);

const isActive = computed(() => {
  if (props.checked !== undefined) {
    return props.checked;
  } else if (props.modelValue !== undefined) {
    return props.modelValue;
  } else {
    return internalActive.value;
  }
});

const toggle = () => {
  const newValue = !isActive.value;

  if (props.checked !== undefined) {
    emit('change', newValue);
    return;
  }

  if (props.modelValue !== undefined) {
    emit('update:modelValue', newValue);
  } else {
    internalActive.value = newValue;
  }

  emit('change', newValue);
};
</script>

<style lang="scss" scoped>
.zmd-sidebar-filter-toggle {
  position: relative;
  display: inline-block;
  padding: 0.4em 1em;
  text-align: left;
  cursor: pointer;
  background-color: #3a3a38;
  color: #ededed;
  transition: all 0.3s ease;
  user-select: none;
  clip-path: polygon(
    0% 0%,
    100% 0%,
    100% calc(100% - 10px),
    calc(100% - 10px) 100%,
    0% 100%
  );

  &.active {
    background-color: #fdfb55;
    color: #222205;
  }
}
</style>
