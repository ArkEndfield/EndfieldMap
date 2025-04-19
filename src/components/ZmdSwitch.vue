// filepath: /Volumes/bietiaop/git/EndfieldMap/src/components/ZmdSwitch.vue
<template>
  <div class="zmd-switch-container">
    <span
      v-if="$slots.default"
      class="zmd-switch__label"
      @click="toggleSwitch"
    >
      <slot></slot>
    </span>
    <div
      class="zmd-switch"
      :class="{ 'is-checked': checked, 'is-disabled': props.disabled }"
      @click="toggleSwitch"
    >
      <span
        class="zmd-switch__core"
        :style="switchStyle"
      >
        <div
          class="zmd-switch__circle"
          :style="circleStyle"
        ></div>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  disabled?: boolean; // 是否禁用
  activeColor?: string; // 打开时的背景颜色
  inactiveColor?: string; // 关闭时的背景颜色
  circleColor?: string; // 圆点颜色
  circleBorder?: string; // 圆点边框颜色
  width?: number; // 开关宽度
  height?: number; // 开关高度
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  activeColor: '#FDFB55',
  inactiveColor: '#C0CCDA',
  circleColor: '#303030',
  width: 36,
  height: 16,
});

const checked = defineModel<boolean>('checked', { default: false });

const emit = defineEmits<{
  (e: 'change', value: boolean): void;
}>();

const toggleSwitch = () => {
  if (props.disabled) return;

  const newValue = !checked.value;
  checked.value = newValue;
  emit('change', newValue);
};

const switchStyle = computed(() => {
  return {
    backgroundColor: checked.value ? props.activeColor : props.inactiveColor,
    width: `${props.width}px`,
    height: `${props.height}px`,
    borderRadius: `${props.height}px`,
  };
});

const circleStyle = computed(() => {
  return {
    backgroundColor: props.circleColor,
  };
});
</script>

<style lang="scss" scoped>
.zmd-switch-container {
  display: flex;
  align-items: center;
  position: relative;
  width: fit-content;
  margin: 0;
  padding: 0;
  gap: 8px;
}

.zmd-switch {
  display: block;
  position: relative;
  user-select: none;

  &.is-disabled {
    opacity: 0.6;
    cursor: url('/cursor/delete.cur'), not-allowed;
  }

  &__core {
    display: block;
    position: relative;
    min-width: v-bind('props.width + "px"');
    height: v-bind('props.height + "px"');
    border-radius: v-bind('props.height + "px"');
    background-color: v-bind(
      'checked ? props.activeColor : props.inactiveColor'
    );
    transition: all 0.3s;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  &__circle {
    position: absolute;
    border-radius: 50%;
    width: v-bind('(props.height - 4) + "px"');
    height: v-bind('(props.height - 4) + "px"');
    left: 2px;
    top: 50%;
    transform: translateY(-50%);
    transition: all 0.3s;
    background-color: v-bind('props.circleColor');
  }

  &.is-checked {
    .zmd-switch__circle {
      left: v-bind('(props.width - props.height + 1) + "px"');
    }
  }
}

.zmd-switch__label {
  line-height: normal;
  display: inline-block;
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
}
</style>
