<template>
  <div
    class="zmd-sidebar-object"
    :class="{ active: isActive }"
    @click="toggle"
  >
    <div class="icon">
      <div class="icon-inner">
        <slot />
      </div>
      <div class="icon-decoration"></div>
    </div>
    <div class="detail">
      <div class="detail-inner">
        <div class="name">
          {{ props.name }}
        </div>
        <div class="count">
          <div class="text">{{ formattedValue }}</div>
        </div>
      </div>
      <div class="corner-decoration top-right"></div>
      <div class="corner-decoration bottom-left"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  name?: string;
  value?: string | number;
  markCount?: number;
  checked?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: '未命名',
  value: 0,
  markCount: 0,
  checked: undefined,
});

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

// 格式化显示的值
const formattedValue = computed(() => {
  if (typeof props.value === 'number' && props.markCount !== undefined) {
    return `${props.markCount}/${props.value}`;
  }
  return props.value;
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
.zmd-sidebar-object {
  display: flex;
  align-items: center;
  filter: drop-shadow(0 0 0.2em rgba(0, 0, 0, 0.6));
  transition: all 0.3s ease;
  padding: 0.5em 0.3em;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 0;
    height: 2px;
    background: #343434;
    transform: translateY(-50%);
    transition: width 0.3s ease;
    z-index: 0;
  }

  .icon {
    width: 2.2em;
    height: 2.2em;
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    transition: all 0.3s ease;

    .icon-inner {
      width: 100%;
      height: 100%;
      background-color: #313131;
      border-radius: 50%;
      box-shadow: 0 0 0.2em rgba(0, 0, 0, 0.3), 0 0 0 0.15em #313131 inset,
        0 0 0 0.25em #605f5f inset;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.4em;
      transition: all 0.4s ease;
      position: relative;
      z-index: 2;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        box-shadow: inset 0 0 0.1em rgba(253, 251, 85, 0);
        transition: all 0.3s ease;
      }

      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: contain;
        transition: transform 0.4s ease;
      }
    }

    .icon-decoration {
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 1;

      &::before,
      &::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }

      &::before {
        border: 1px dashed rgba(253, 251, 85, 0.3);
        border-left: 2px solid rgba(253, 251, 85, 0.6);
        border-right: 2px solid rgba(253, 251, 85, 0.6);
      }

      &::after {
        border: 1px dashed rgba(253, 251, 85, 0.3);
        border-top: 2px solid rgba(253, 251, 85, 0.6);
        border-bottom: 2px solid rgba(253, 251, 85, 0.6);
        transform: rotate(45deg);
      }
    }
  }

  .detail {
    background-color: #1d1d1d;
    box-shadow: 0 0 0 0.1em #242424 inset;
    position: relative;
    z-index: 1;
    margin-left: -1em;
    border-radius: 0 9999px 9999px 0;
    flex-grow: 1;
    transition: all 0.3s ease;
    overflow: hidden;

    .detail-inner {
      padding: 0.3em 0;
      padding-left: 1.2em;
      padding-right: 0.4em;
      display: flex;
      width: 100%;
      position: relative;
      z-index: 3;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
    }

    .name {
      flex: 1;
      font-size: 0.8em;
      transition: color 0.3s ease;
      margin-right: 0.5em;
      color: #cccccc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      padding-left: 0.2em;
    }

    .count {
      flex-grow: 0;
      flex-shrink: 0;
      font-weight: 500;
      transition: all 0.3s ease;
      background-color: #2a2a2a;
      color: #aaaaaa;
      padding: 0.03em 0.05em;
      border-radius: 9999px;
      min-width: 1.2em;
      text-align: center;
      box-shadow: 0 0 0 1px #333333;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      margin-left: 0.1em;
      .text {
        transform: scale(0.6);
      }
    }

    .corner-decoration {
      position: absolute;
      width: 0.5em;
      height: 0.5em;
      opacity: 0;
      transition: opacity 0.3s ease;

      &.top-right {
        top: 0;
        right: 0;
        border-top: 1px solid transparent;
        border-right: 1px solid transparent;
      }

      &.bottom-left {
        bottom: 0;
        left: 1em;
        border-bottom: 1px solid transparent;
        border-left: 1px solid transparent;
      }
    }
  }

  &.active {
    filter: drop-shadow(0 0 0.3em rgba(253, 251, 85, 0.3));

    &::before {
      width: 0.6em;
      background: #fdfb55;
    }

    .icon {
      transform: scale(1.05);

      .icon-inner {
        box-shadow: 0 0 0.2em rgba(0, 0, 0, 0.3), 0 0 0 0.15em #313131 inset,
          0 0 0 0.25em #fdfb55 inset;

        &::after {
          box-shadow: inset 0 0 0.5em rgba(253, 251, 85, 0.5);
        }

        img {
          transform: scale(1.1) rotate(5deg);
        }
      }

      .icon-decoration {
        opacity: 1;
        border-color: rgba(253, 251, 85, 0.5);
        animation: rotate 3s linear infinite;
      }
    }

    .detail {
      box-shadow: 0 0 0 0.1em rgba(253, 251, 85, 0.4) inset;
      background-color: #252525;

      .name,
      .count {
        color: #fdfb55;
        text-shadow: 0 0 5px rgba(253, 251, 85, 0.5);
      }

      .count {
        background-color: rgba(253, 251, 85, 0.15);
        box-shadow: 0 0 0 1px rgba(253, 251, 85, 0.4);
      }

      .corner-decoration {
        opacity: 1;

        &.top-right {
          height: 100%;
          border-color: rgba(253, 251, 85, 0.7);
          animation: cornerExpandTopRight 1.5s ease-in-out infinite alternate;
          border-top-right-radius: 9999px;
          border-bottom-right-radius: 9999px;
        }

        &.bottom-left {
          border-color: rgba(253, 251, 85, 0.7);
          animation: cornerExpandBottomLeft 1.5s ease-in-out infinite alternate;
        }
      }
    }
  }

  &:hover:not(.active) {
    .icon .icon-inner {
      box-shadow: 0 0 0.2em rgba(0, 0, 0, 0.3), 0 0 0 0.15em #313131 inset,
        0 0 0 0.25em #777 inset;
    }

    .detail {
      background-color: #222222;

      .name {
        color: #dddddd;
      }

      .count {
        background-color: #333333;
        color: #bbbbbb;
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes cornerExpandTopRight {
  0% {
    width: 1em;
  }
  100% {
    width: 3em;
  }
}

@keyframes cornerExpandBottomLeft {
  0% {
    width: 0.6em;
  }
  100% {
    width: 1em;
  }
}
</style>
