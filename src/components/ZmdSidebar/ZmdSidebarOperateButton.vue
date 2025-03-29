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
$border-color: #575757;
$small-color: #8e8e8e;
$glow-color: rgba(124, 124, 124, 0.441);
$glow-color-active: rgba(124, 124, 124, 1);

.zmd-sidebar-operate-button {
  min-width: 6em;
  position: relative;
  padding: 0.5em 1em;
  padding-bottom: 0.3em;
  text-align: center;
  transition: all 0.3s;
  overflow: hidden;
  user-select: none;

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
    transition: width 0.2s ease-out 0.2s, height 0.3s ease-out 0s,
      opacity 0.3s ease;

    &.active {
      transition: width 0.2s ease-out 0s, height 0.3s ease-out 0.2s,
        opacity 0.3s ease;
      width: 100%;
      height: 100%;
    }
  }

  .default-gradient {
    background-image: linear-gradient(
      to bottom,
      transparent 0%,
      $glow-color 50%,
      transparent 100%
    );
    opacity: 1;
  }

  .active-gradient {
    background-image: linear-gradient(
      to bottom,
      transparent 0%,
      $glow-color-active 100%,
      transparent 100%
    );
    opacity: 0;
  }

  &:active {
    .default-gradient {
      opacity: 0;
    }
    .active-gradient {
      opacity: 1;
      width: 100%;
      height: 100%;
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
    }
  }

  &__title {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.1em;
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
  }
}
</style>
