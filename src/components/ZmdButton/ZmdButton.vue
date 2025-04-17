<template>
  <button
    :disabled="isDisabled"
    :class="{ 'is-disabled': isDisabled }"
    @click="handleClick"
    @mouseenter="animateEnter"
    @mouseleave="animateLeave"
  >
    <div
      class="zmd-button"
      :class="[type]"
      ref="buttonRef"
    >
      <div class="text">
        <slot>{{ text }}</slot>
      </div>
      <div
        class="icon"
        v-if="showIcon"
      >
        <motion.div
          v-if="loading"
          class="loading-spinner"
          :animate="{ rotate: 360 }"
          :transition="{
            duration: 1,
            ease: 'linear',
            repeat: Infinity,
          }"
        ></motion.div>
        <slot
          name="icon"
          v-else
        ></slot>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { motion, useAnimate } from 'motion-v';

const props = withDefaults(
  defineProps<{
    type?: 'primary' | 'default';
    text?: string;
    showIcon?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    type: 'primary',
    text: '',
    showIcon: true,
    loading: false,
    disabled: false,
  }
);

const emit = defineEmits(['click']);

const isDisabled = ref(props.disabled);
const [buttonRef, buttonAnimate] = useAnimate();

const handleClick = () => {
  if (!isDisabled.value) {
    emit('click');
  }
};

async function animateEnter() {
  if (isDisabled.value) return;

  const styles =
    props.type === 'primary'
      ? {
          backgroundColor: ['#2a272877', '#2a2728b5', '#2a272877', '#2a2728b5'],
          boxShadow: [
            '0 0 0 0.1em #2a272877, 0 0 0 0.1em #81807f inset',
            '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
            '0 0 0 0.1em #2a272877, 0 0 0 0.1em #81807f inset',
            '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
          ],
        }
      : {
          backgroundColor: ['#f2f1efb5', '#f2f1ef'],
          boxShadow: [
            '0 0 0 0.1em #f2f1efb5, 0 0 0 0.1em #a0a2a3 inset',
            '0 0 0 0.1em #f2f1ef, 0 0 0 0.1em #a0a2a3 inset',
          ],
        };

  await buttonAnimate(buttonRef.value, styles, { duration: 0.2 });
}

async function animateLeave() {
  if (isDisabled.value) return;

  const styles =
    props.type === 'primary'
      ? {
          backgroundColor: ['#2a2728b5', '#2a2728', '#2a2728b5', '#2a2728'],
          boxShadow: [
            '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
            '0 0 0 0.1em #2a2728, 0 0 0 0.1em #81807f inset',
            '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
            '0 0 0 0.1em #2a2728, 0 0 0 0.1em #81807f inset',
          ],
        }
      : {
          backgroundColor: ['#f2f1ef', '#f2f1efb5'],
          boxShadow: [
            '0 0 0 0.1em #f2f1ef, 0 0 0 0.1em #a0a2a3 inset',
            '0 0 0 0.1em #f2f1efb5, 0 0 0 0.1em #a0a2a3 inset',
          ],
        };

  await buttonAnimate(buttonRef.value, styles, { duration: 0.2 });
}
</script>

<style lang="scss" scoped>
$primary-color: #2a2728;
$primary-text-color: #fefcfc;
$primary-hover-color: #2a2728b5;
$primary-border-color: #81807f;
$default-color: #f2f1ef;
$default-text-color: #4d4d4d;
$default-hover-color: #f2f1efb5;
$default-border-color: #a0a2a3;

button {
  all: unset;
  flex: 1;
  max-width: 50%;

  &.is-disabled {
    opacity: 0.7;
    pointer-events: none;
  }
}

.zmd-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.3em 0.35em;

  .text {
    flex: 1;
    text-align: center;
  }

  .icon {
    width: 1.3em;
    height: 1.3em;
    border-radius: 50%;
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .loading-spinner {
      width: 1em;
      height: 1em;
      border: 2px solid rgb(255, 187, 0);
      border-top: 2px solid #fff;
      border-radius: 50%;
    }
  }

  &.primary {
    background-color: $primary-color;
    color: $primary-text-color;
    box-shadow: 0 0 0 0.1em $primary-color,
      0 0 0 0.1em $primary-border-color inset;

    .icon {
      background-color: $primary-text-color;
      color: $primary-color;
      transition: color 0.3s;

      svg {
        font-size: 1.3em;
      }
    }
  }

  &.default {
    background-color: $default-color;
    color: $default-text-color;
    box-shadow: 0 0 0 0.1em $default-color,
      0 0 0 0.1em $default-border-color inset;

    .icon {
      background-color: $default-text-color;
      color: $default-color;
      transition: color 0.3s;

      svg {
        font-size: 1em;
      }
    }
  }
}
</style>
