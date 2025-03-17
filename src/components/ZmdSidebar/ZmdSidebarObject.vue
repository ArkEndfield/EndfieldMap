<template>
  <div
    class="zmd-sidebar-object"
    :class="{ active: isActive }"
    @click="toggle"
  >
    <div class="icon">
      <slot />
    </div>
    <div class="detail">
      <div class="name">
        {{ props.name }}
      </div>
      <div class="count">
        {{ props.value }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  name?: string;
  value?: string | number;
  modelValue?: boolean;
  checked?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: '未命名',
  value: 0,
  modelValue: undefined,
  checked: undefined,
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
.zmd-sidebar-object {
  display: flex;
  align-items: center;
  filter: drop-shadow(0 0 0.2em rgba(0, 0, 0, 0.6));
  transition: all 0.3s ease;

  .icon {
    width: 3em;
    height: 3em;
    background-color: #313131;
    border-radius: 50%;
    box-shadow: 0 0 0.2em rgba(0, 0, 0, 0.3), 0 0 0 0.15em #313131 inset,
      0 0 0 0.25em #605f5f inset;
    position: relative;
    z-index: 2;
    transition: box-shadow 0.3s ease;
    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: contain;
    }
  }
  .detail {
    background-color: #1d1d1d;
    box-shadow: 0 0 0 0.1em #242424 inset;
    position: relative;
    z-index: 1;
    padding: 0.5em 0;
    margin-left: -1em;
    padding-left: 1.2em;
    padding-right: 1em;
    display: flex;
    border-radius: 0 9999px 9999px 0;
    flex-grow: 1;
    .name {
      flex: 1;
      font-size: 0.8em;
    }
    .count {
      flex-grow: 0;
      flex-shrink: 0;
      font-size: 0.8em;
    }
  }

  &.active {
    filter: drop-shadow(0 0 0.2em #fdfa5581);
    .icon {
      box-shadow: 0 0 0.2em rgba(0, 0, 0, 0.3), 0 0 0 0.15em #313131 inset,
        0 0 0 0.25em #fdfb55 inset;
    }
    .detail {
      box-shadow: 0 0 0 0.1em #fdfa556b inset;
    }
  }
}
</style>
