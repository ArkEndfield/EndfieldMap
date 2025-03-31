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

interface Props {
  checked?: boolean;
}

const props = defineProps<Props>();

const modelValue = defineModel<boolean>({ default: false });

const emit = defineEmits(['change']);

const internalActive = ref(false);

const isActive = computed(() => {
  if (props.checked !== undefined) {
    return props.checked;
  } else if (modelValue.value !== undefined) {
    return modelValue.value;
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

  if (modelValue.value !== undefined) {
    modelValue.value = newValue;
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
  white-space: nowrap;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #fdfb55;
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.4s ease;
    z-index: -1;
  }

  &.active {
    color: #222205;

    &::before {
      transform: scaleX(1);
      transform-origin: left;
    }
  }
}
</style>
