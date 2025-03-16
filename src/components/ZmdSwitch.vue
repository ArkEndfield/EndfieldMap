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
      :class="{ 'is-checked': actualValue, 'is-disabled': disabled }"
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
import { computed, ref, watch, getCurrentInstance } from 'vue';

interface Props {
  modelValue?: boolean; // 开关状态
  disabled?: boolean; // 是否禁用
  activeColor?: string; // 打开时的背景颜色
  inactiveColor?: string; // 关闭时的背景颜色
  circleColor?: string; // 圆点颜色
  circleBorder?: string; // 圆点边框颜色
  width?: number; // 开关宽度
  height?: number; // 开关高度
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  activeColor: '#FDFB55',
  inactiveColor: '#C0CCDA',
  circleColor: '#303030',
  circleBorder: '#0C0D2D',
  width: 36,
  height: 16,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', value: boolean): void;
}>();

const instance = getCurrentInstance();
const isControlled = computed(() => {
  return instance?.vnode.props?.hasOwnProperty('modelValue');
});

const innerValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  val => {
    if (isControlled.value) {
      innerValue.value = val;
    }
  }
);

const actualValue = computed(() => {
  return isControlled.value ? props.modelValue : innerValue.value;
});

const toggleSwitch = () => {
  if (props.disabled) return;

  const newValue = !actualValue.value;

  if (isControlled.value) {
    emit('update:modelValue', newValue);
  } else {
    innerValue.value = newValue;
  }

  emit('change', newValue);
};

const switchStyle = computed(() => {
  return {
    backgroundColor: actualValue.value
      ? props.activeColor
      : props.inactiveColor,
    width: `${props.width}px`,
    height: `${props.height}px`,
    borderRadius: `${props.height}px`,
  };
});

const circleStyle = computed(() => {
  return {
    backgroundColor: props.circleColor,
    borderColor: props.circleBorder,
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
  cursor: pointer;
  user-select: none;
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &__core {
    display: block;
    position: relative;
    min-width: v-bind('props.width + "px"');
    height: v-bind('props.height + "px"');
    border-radius: v-bind('props.height + "px"');
    background-color: v-bind(
      'actualValue ? props.activeColor : props.inactiveColor'
    );
    transition: all 0.3s;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  &__circle {
    position: absolute;
    border-radius: 50%;
    width: v-bind('(props.height - 4) + "px"');
    height: v-bind('(props.height - 4) + "px"');
    left: 2px;
    top: 50%;
    border: 1px solid v-bind('props.circleBorder');
    transform: translateY(-50%);
    transition: all 0.3s;
    background-color: v-bind('props.circleColor');
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  }

  &.is-checked {
    .zmd-switch__circle {
      left: v-bind('(props.width - props.height + 2) + "px"');
    }
  }
}

.zmd-switch__label {
  line-height: normal;
  display: inline-block;
  cursor: pointer;
}
</style>
