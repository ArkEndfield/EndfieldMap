<template>
  <button
    :disabled="isDisabled"
    :class="[className, { 'is-disabled': isDisabled }]"
    @click="handleClick"
    @mouseenter="animateEnter"
    @mouseleave="animateLeave"
  >
    <div
      class="zmd-button"
      :class="[type, size, { 'is-reverse': reverse }]"
      ref="buttonRef"
    >
      <div class="text">
        <div class="text-content">
          <div class="decorative-line"></div>
          <slot>{{ text }}</slot>
        </div>
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
    type?: 'primary' | 'secondary' | 'danger';
    text?: string;
    showIcon?: boolean;
    loading?: boolean;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
    reverse?: boolean;
  }>(),
  {
    type: 'secondary',
    text: '',
    showIcon: true,
    loading: false,
    disabled: false,
    size: 'medium',
    className: '',
    reverse: false,
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

  const styles = {
    primary: {
      backgroundColor: ['#FDFB72', '#FDFB72b5', '#FDFB72', '#FDFB72b5'],
      boxShadow: [
        '0 0 0 0.1em #FDFB72, 0 0 0 0.1em #2a2728 inset',
        '0 0 0 0.1em #FDFB72b5, 0 0 0 0.1em #2a2728 inset',
        '0 0 0 0.1em #FDFB72, 0 0 0 0.1em #2a2728 inset',
        '0 0 0 0.1em #FDFB72b5, 0 0 0 0.1em #2a2728 inset',
      ],
    },
    secondary: {
      backgroundColor: ['#2a272877', '#2a2728b5', '#2a272877', '#2a2728b5'],
      boxShadow: [
        '0 0 0 0.1em #2a272877, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a272877, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
      ],
    },
    danger: {
      backgroundColor: ['#ff4d4f', '#ff7875', '#ff4d4f', '#ff7875'],
      boxShadow: [
        '0 0 0 0.1em #ff4d4f, 0 0 0 0.1em #d9363e inset',
        '0 0 0 0.1em #ff7875, 0 0 0 0.1em #d9363e inset',
        '0 0 0 0.1em #ff4d4f, 0 0 0 0.1em #d9363e inset',
        '0 0 0 0.1em #ff7875, 0 0 0 0.1em #d9363e inset',
      ],
    },
    default: {
      backgroundColor: ['#f2f1efb5', '#f2f1ef'],
      boxShadow: [
        '0 0 0 0.1em #f2f1efb5, 0 0 0 0.1em #a0a2a3 inset',
        '0 0 0 0.1em #f2f1ef, 0 0 0 0.1em #a0a2a3 inset',
      ],
    },
  };

  await buttonAnimate(buttonRef.value, styles[props.type], { duration: 0.2 });
}

async function animateLeave() {
  if (isDisabled.value) return;

  const styles = {
    primary: {
      backgroundColor: ['#FDFB72b5', '#FDFB72', '#FDFB72b5', '#FDFB72'],
      boxShadow: [
        '0 0 0 0.1em #FDFB72b5, 0 0 0 0.1em #2a2728 inset',
        '0 0 0 0.1em #FDFB72, 0 0 0 0.1em #2a2728 inset',
        '0 0 0 0.1em #FDFB72b5, 0 0 0 0.1em #2a2728 inset',
        '0 0 0 0.1em #FDFB72, 0 0 0 0.1em #2a2728 inset',
      ],
    },
    secondary: {
      backgroundColor: ['#2a2728b5', '#2a2728', '#2a2728b5', '#2a2728'],
      boxShadow: [
        '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728, 0 0 0 0.1em #81807f inset',
      ],
    },
    danger: {
      backgroundColor: ['#ff7875', '#ff4d4f', '#ff7875', '#ff4d4f'],
      boxShadow: [
        '0 0 0 0.1em #ff7875, 0 0 0 0.1em #d9363e inset',
        '0 0 0 0.1em #ff4d4f, 0 0 0 0.1em #d9363e inset',
        '0 0 0 0.1em #ff7875, 0 0 0 0.1em #d9363e inset',
        '0 0 0 0.1em #ff4d4f, 0 0 0 0.1em #d9363e inset',
      ],
    },
    default: {
      backgroundColor: ['#f2f1ef', '#f2f1efb5'],
      boxShadow: [
        '0 0 0 0.1em #f2f1ef, 0 0 0 0.1em #a0a2a3 inset',
        '0 0 0 0.1em #f2f1efb5, 0 0 0 0.1em #a0a2a3 inset',
      ],
    },
  };

  await buttonAnimate(buttonRef.value, styles[props.type], { duration: 0.2 });
}
</script>

<style lang="scss" scoped>
$primary-color: #fdfb72;
$primary-text-color: #2a2728;
$primary-hover-color: #fdfb72b5;
$primary-border-color: #2a2728;
$secondary-color: #2a2728;
$secondary-text-color: #fefcfc;
$secondary-hover-color: #2a2728b5;
$secondary-border-color: #81807f;
$danger-color: #ff4d4f;
$danger-text-color: #ffffff;
$danger-hover-color: #ff7875;
$danger-border-color: #d9363e;
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
    cursor: not-allowed;
    pointer-events: none;
  }
}

.zmd-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  gap: 0.5em;
  min-width: 6em;
  font-size: 1rem;

  &.is-reverse {
    flex-direction: row-reverse;

    .text-content {
      flex-direction: row-reverse;
    }
  }

  &.small {
    padding: 0.3em 0.45em;
    padding-left: 0.8em;
    font-size: 0.875rem;
    min-width: 5em;

    &.is-reverse {
      padding: 0.3em 0.45em;
      padding-right: 0.8em;
    }

    .icon {
      width: 1.1em;
      height: 1.1em;
      .loading-spinner {
        width: 0.8em;
        height: 0.8em;
      }
      * {
        font-size: 0.8em;
      }
    }
  }

  &.medium {
    padding: 0.5em 0.6em;
    padding-left: 1em;
    font-size: 1rem;
    min-width: 6em;

    &.is-reverse {
      padding: 0.5em 0.6em;
      padding-right: 1em;
    }

    .icon {
      width: 1.3em;
      height: 1.3em;

      .loading-spinner {
        width: 1em;
        height: 1em;
      }

      svg {
        font-size: 1em;
      }
    }
  }

  &.large {
    padding: 0.7em 0.8em;
    padding-left: 1.2em;
    font-size: 1.125rem;
    min-width: 10em;

    &.is-reverse {
      padding: 0.7em 0.8em;
      padding-right: 1.2em;
    }

    .icon {
      width: 1.5em;
      height: 1.5em;

      .loading-spinner {
        width: 1.2em;
        height: 1.2em;
      }

      svg {
        font-size: 1.125em;
      }
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

  &.secondary {
    background-color: $secondary-color;
    color: $secondary-text-color;
    box-shadow: 0 0 0 0.1em $secondary-color,
      0 0 0 0.1em $secondary-border-color inset;

    .icon {
      background-color: $secondary-text-color;
      color: $secondary-color;
      transition: color 0.3s;

      svg {
        font-size: 1.3em;
      }
    }
  }

  &.danger {
    background-color: $danger-color;
    color: $danger-text-color;
    box-shadow: 0 0 0 0.1em $danger-color,
      0 0 0 0.1em $danger-border-color inset;

    .icon {
      background-color: $danger-text-color;
      color: $danger-color;
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

  .text {
    flex: 1;
    text-align: center;

    .text-content {
      display: flex;
      align-items: center;
      gap: 0.5em;

      .decorative-line {
        flex: 1;
        min-width: 1em;
        height: 1px;
        background-color: currentColor;
        position: relative;

        &::before,
        &::after {
          content: '';
          position: absolute;
          width: 3px;
          height: 3px;
          background-color: currentColor;
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
        }

        &::before {
          left: 0;
        }

        &::after {
          right: 0;
        }
      }
    }
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
}
</style>
