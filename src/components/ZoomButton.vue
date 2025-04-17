<template>
  <button class="diamond-button-container">
    <div
      class="diamond-button drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]"
      :class="{ disabled }"
    >
      <div class="button-border top"></div>
      <div class="button-border right"></div>
      <div class="button-border bottom"></div>
      <div class="button-border left"></div>
      <div class="button-content">
        <slot></slot>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);
</script>

<style lang="scss" scoped>
.diamond-button-container {
  display: inline-block;
  margin: 10px;
}

.diamond-button {
  position: relative;
  background-color: #222122;
  border: none;
  width: 100%;
  height: 100%;
  transform: rotate(45deg);
  transition: all 0.3s ease;
  padding: 0;
  outline: none;

  .button-border {
    $border-width: 0.2em;
    $overflow: 0.1em;
    position: absolute;
    background-color: rgb(255, 255, 255);
    &.top {
      top: -$overflow;
      left: -$overflow;
      width: calc(100% + $overflow * 2);
      height: $border-width;
    }

    &.right {
      top: -$overflow;
      right: -$overflow;
      width: $border-width;
      height: calc(100% + $overflow * 2);
    }

    &.bottom {
      bottom: -$overflow;
      right: -$overflow;
      width: calc(100% - $border-width * 2 + $overflow * 2);
      height: $border-width;
    }

    &.left {
      top: -$overflow;
      left: -$overflow;
      width: $border-width;
      height: calc(100% + $overflow * 2);
    }
  }

  &:hover {
    background-color: #333233;
  }

  &:active {
    background-color: #111011;
    transform: rotate(45deg) scale(0.95);
  }

  &.disabled {
    opacity: 0.5;

    &:hover,
    &:active {
      background-color: #222122;
      transform: rotate(45deg);
    }

    .button-border {
      opacity: 0.3;
    }
  }

  .button-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    transform: rotate(-45deg);
    color: white;
    font-size: 16px;
  }
}
</style>
