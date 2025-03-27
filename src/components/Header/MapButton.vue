<template>
  <button
    class="block py-2 map-button text-lg font-black"
    :class="{ active: props.active }"
  >
    <div class="dots">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <div class="button-title"><slot></slot></div>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    active?: boolean;
  }>(),
  {
    active: false,
  }
);
</script>

<style lang="scss" scoped>
$bg-line-color: #3838385a;
$bg-bg-color: #303030e3;
.map-button {
  position: relative;
  background-color: $bg-bg-color;
  background-image: repeating-linear-gradient(
    75deg,
    transparent,
    transparent 0.1em,
    $bg-line-color 0.15em,
    $bg-line-color 0.2em
  );
  .dots {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    div {
      position: absolute;
      width: 0.2em;
      height: 0.2em;
      background-color: #797979;
      animation: pulse 1.5s infinite;
      $gap: 0.2em;
      &:nth-child(1) {
        top: $gap;
        left: $gap;
      }
      &:nth-child(2) {
        top: $gap;
        right: $gap;
      }
      &:nth-child(3) {
        bottom: $gap;
        left: $gap;
      }
      &:nth-child(4) {
        bottom: $gap;
        right: $gap;
      }
    }
  }
  .button-title {
    position: relative;
    z-index: 1;
    &::before,
    &::after {
      content: '';
      display: block;
      position: absolute;
      top: 0.2em;
      bottom: 0.2em;
      width: 0.25em;
      border: 0.15em solid #444444;
    }
    &::before {
      left: 1em;
      border-right-width: 0;
    }
    &::after {
      right: 1em;
      border-left-width: 0;
    }
  }
  &.active,
  &:hover {
    background-image: none;
  }
  &:hover {
    background-color: #393939;
  }
  &.active {
    background-color: #fcfb58;
    color: #444444;
  }
}
</style>
