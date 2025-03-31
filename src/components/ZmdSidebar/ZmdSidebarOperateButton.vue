<template>
  <div
    class="zmd-sidebar-operate-button"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="animation-element-container">
      <div
        class="animation-element default-gradient"
        :class="{ active: isHovered }"
      ></div>
      <div
        class="animation-element active-gradient"
        :class="{ active: isHovered }"
      ></div>
    </div>

    <div class="zmd-sidebar-operate-button__title">
      <div
        class="zmd-sidebar-operate-button__title__icon"
        :hidden="!$slots.icon"
      >
        <slot name="icon" />
      </div>
      <div class="zmd-sidebar-operate-button__title__text">
        <slot />
      </div>
    </div>
    <div class="zmd-sidebar-operate-button__subtitle">
      <slot name="subtitle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const isHovered = ref(false);
</script>

<style lang="scss" scoped>
$border-width: 1.5px;
$border-height: 40%;
$border-color: #35383d;
$small-color: #707275;
$highlight-color: #c1c1c1;
$highlight-color-dim: rgba(193, 193, 193, 0.4);
$bg-color-hover: rgba(40, 40, 42, 0.7);
$bg-color-active: rgba(50, 50, 54, 0.9);
$border-glow: rgba(193, 193, 193, 0.15);

.zmd-sidebar-operate-button {
  min-width: 6em;
  width: auto;
  position: relative;
  padding: 0.5em 1em;
  padding-bottom: 0.3em;
  text-align: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;
  border-radius: 2px;

  &:hover {
    background-color: $bg-color-hover;
  }

  &:active {
    background-color: $bg-color-active;
  }

  .animation-element-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
  }

  .animation-element {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0;
    height: 2px;
    transform: translate(-50%, -50%);
    transition: width 0.2s ease-out 0.1s, height 0.25s ease-out 0s,
      opacity 0.25s ease;

    &.active {
      transition: width 0.2s ease-out 0s, height 0.25s ease-out 0.15s,
        opacity 0.25s ease;
      width: calc(100% - 2px);
      height: calc(100% - 2px);
      border: none;
      background: linear-gradient(
            to right,
            $highlight-color 0%,
            $highlight-color-dim 50%,
            $highlight-color 100%
          )
          top,
        linear-gradient(
            to right,
            $highlight-color 0%,
            $highlight-color-dim 50%,
            $highlight-color 100%
          )
          bottom,
        linear-gradient(
            to bottom,
            $highlight-color 0%,
            $highlight-color-dim 50%,
            $highlight-color 100%
          )
          left,
        linear-gradient(
            to bottom,
            $highlight-color 0%,
            $highlight-color-dim 50%,
            $highlight-color 100%
          )
          right;
      background-size: 100% 1px, 100% 1px, 1px 100%, 1px 100%;
      background-repeat: no-repeat;
      box-shadow: inset 0 0 5px $border-glow;
    }
  }

  .default-gradient {
    background: transparent;
    opacity: 1;

    &.active {
      opacity: 0;
    }
  }

  .active-gradient {
    background: transparent;
    opacity: 0;

    &.active {
      opacity: 1;
    }
  }

  &:active {
    .default-gradient {
      opacity: 0;
    }
    .active-gradient {
      opacity: 1;
      width: calc(100% - 2px);
      height: calc(100% - 2px);
      border: none;
      background: linear-gradient(
            to right,
            $highlight-color 0%,
            $highlight-color-dim 50%,
            $highlight-color 100%
          )
          top,
        linear-gradient(
            to right,
            $highlight-color 0%,
            $highlight-color-dim 50%,
            $highlight-color 100%
          )
          bottom,
        linear-gradient(
            to bottom,
            $highlight-color 0%,
            $highlight-color-dim 50%,
            $highlight-color 100%
          )
          left,
        linear-gradient(
            to bottom,
            $highlight-color 0%,
            $highlight-color-dim 50%,
            $highlight-color 100%
          )
          right;
      background-size: 100% 1px, 100% 1px, 1px 100%, 1px 100%;
      background-repeat: no-repeat;
      box-shadow: inset 0 0 5px $border-glow;
    }
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0.5em;
    right: 0;
    width: $border-width;
    height: $border-height;
    display: inline-block;
    background-color: $border-color;
    transition: all 0.25s;
  }

  &:nth-child(1) {
    &::before {
      content: '';
      position: absolute;
      bottom: 0.5em;
      left: 0;
      width: $border-width;
      height: $border-height;
      display: inline-block;
      background-color: $border-color;
      transition: all 0.25s;
    }
  }

  &__title {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.1em;
    transition: color 0.25s;
  }

  &:hover &__title,
  &:active &__title {
    color: $highlight-color;
  }

  &__subtitle {
    position: relative;
    z-index: 2;
    transform: scale(0.2);
    transform-origin: center top;
    color: $small-color;
    letter-spacing: 0.8em;
    width: 500%;
    margin: 0 -200%;
    text-align: center;
    height: 0.5em;
    line-height: 1;
    margin-top: 0em;
    white-space: nowrap;
    overflow: visible;
    display: block;
    font-size: 1rem;
    transition: color 0.25s;
  }

  &:hover &__subtitle,
  &:active &__subtitle {
    color: rgba(170, 170, 170, 0.8);
  }
}
</style>
