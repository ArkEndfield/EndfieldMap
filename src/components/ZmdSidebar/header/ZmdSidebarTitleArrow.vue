<template>
  <motion.div
    class="zmd-sidebar-title-arrow"
    :initial="{
      x: open ? 'var(--collapsed-x)' : 0,
    }"
    :animate="{
      x: open ? 0 : 'var(--collapsed-x)',
    }"
    :transition="{
      type: 'spring',
      duration: 0.5,
    }"
  >
    <div
      class="zmd-sidebar-title-arrow-start-part"
      @click="toggleOpen"
    ></div>
    <div
      class="zmd-sidebar-title-arrow-middle-part"
      @click="toggleOpen"
    ></div>
    <div
      class="zmd-sidebar-title-arrow-end-part"
      @click="toggleOpen"
    >
      <div
        class="zmd-sidebar-open-arrow-bg-title"
        :class="{ 'zmd-sidebar-open-arrow-bg-title-open': open }"
      >
        {{ open ? 'FOLD' : 'UNFOLD' }}
      </div>
      <div
        class="zmd-sidebar-open-arrow-title"
        :class="{ 'zmd-sidebar-open-arrow-title-open': open }"
      >
        {{ open ? t('sidebar.fold') : t('sidebar.unfold') }}
      </div>
      <div class="zmd-sidebar-title-arrow-lines">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    <div
      class="zmd-sidebar-title-arrow-arrow-part"
      @click="toggleOpen"
      id="fold-arrow"
    ></div>
    <div
      class="zmd-sidebar-title-arrow-arrow-line"
      @click="toggleOpen"
    ></div>
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const open = defineModel<boolean>('open', { default: false });
// 切换open状态
const toggleOpen = () => {
  open.value = !open.value;
};
</script>

<style lang="scss" scoped>
@use '@/styles/zmd.scss' as zmd;
$color: #424241;
$color1: #3a3a38;
$border-color: #3a3a38;
$border-size: 0.1em;
$arrow-size: 1.8em;
$line-size: 2.3em;
$arrow-height: 5em;
.zmd-sidebar-title-arrow {
  --collapsed-x: calc(-100% + 7em);
  display: flex;
  justify-content: start;
  align-items: center;
  width: calc(100% + $arrow-size * 2 + 2.4em);
  transition: filter 0.3s;
  position: relative;
  overflow: visible;
  user-select: none;
  filter: drop-shadow(0.1em 0.1em 0em rgba(255, 255, 255, 0.2));
  --arrow-font-size: 1em;

  @media screen and (width < zmd.$phone-width) {
    & {
      --collapsed-x: -100%;
      --arrow-font-size: 0.8em;
    }
  }

  @media screen and (width >= zmd.$large-screen-width) {
    width: calc(100% + $arrow-size * 2 + 7em);
  }

  &:has(
      .zmd-sidebar-title-arrow-start-part:hover,
      .zmd-sidebar-title-arrow-middle-part:hover,
      .zmd-sidebar-title-arrow-end-part:hover,
      .zmd-sidebar-title-arrow-arrow-part:hover,
      .zmd-sidebar-title-arrow-arrow-line:hover
    ) {
    .zmd-sidebar-title-arrow-arrow-line {
      transform: translateX(-0.5em);
    }
  }
  .zmd-sidebar-title-arrow-start-part {
    flex: 1;
    height: $line-size;
    background: linear-gradient(to right, $color 0%, $color1 100%);
    margin-bottom: calc($arrow-height - $line-size);
    border-left: $border-size solid $border-color;
  }
  .zmd-sidebar-title-arrow-middle-part {
    width: $line-size;
    height: $arrow-height;
    background-color: $color1;
    border-radius: 0 1em 0 1em;
    position: relative;
    $corner-size: 0.3em;
    flex-shrink: 0;
    flex-grow: 0;
    &::after {
      content: '';
      position: absolute;
      width: $corner-size;
      height: $corner-size;
      right: calc(0px - $corner-size);
      bottom: $line-size;
      background-image: radial-gradient(
        circle at 100% 0,
        transparent $corner-size,
        $color $corner-size
      );
    }
    &::before {
      content: '';
      position: absolute;
      width: $corner-size;
      height: $corner-size;
      left: calc(0px - $corner-size);
      bottom: calc($arrow-height - $line-size - $corner-size);
      background-image: radial-gradient(
        circle at 0 100%,
        transparent $corner-size,
        $color $corner-size
      );
    }
  }
  .zmd-sidebar-title-arrow-end-part {
    flex: 1;
    height: $line-size;
    background-color: $color1;
    margin-top: calc($arrow-height - $line-size);
    position: relative;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    color: white;
    font-weight: 600;
    .zmd-sidebar-open-arrow-bg-title {
      position: absolute;
      z-index: 0;
      color: #474645;
      font-family: 'Outfit', sans-serif;
      letter-spacing: -0.1em;
      font-size: 1.2em;
      margin-right: -2em;
      &.zmd-sidebar-open-arrow-bg-title-open {
        margin-right: -1em;
      }
    }
    .zmd-sidebar-open-arrow-title {
      z-index: 1;
      margin-right: -2em;
      &.zmd-sidebar-open-arrow-title-open {
        color: #fdfb72;
      }
    }
    .zmd-sidebar-title-arrow-lines {
      $color: #4f4f4e;
      display: flex;
      flex-direction: column;
      position: absolute;
      bottom: 0;
      width: 5em;
      left: -1em;
      span {
        width: 100%;
        height: 0.13em;
        background-color: $color;
        position: relative;
        &:nth-child(1) {
          width: 82%;
          &::before {
            content: '';
            position: absolute;
            width: 0.13em;
            height: 0.13em;
            background-color: $color;
            left: 100%;
            top: -0.13em;
          }
        }
        &:nth-child(2) {
          width: 72%;
        }
        &:nth-child(3) {
          &::before {
            content: '';
            position: absolute;
            width: 0.13em;
            height: 0.13em;
            background-color: $color;
            left: -0.13em;
            top: 0;
          }
        }
      }
    }
  }
  .zmd-sidebar-title-arrow-arrow-part {
    flex-grow: 0;
    flex-shrink: 0;
    width: 0;
    height: 0;
    border-top: $arrow-size solid transparent;
    border-bottom: $arrow-size solid transparent;
    border-left: calc($arrow-size * 2) solid $color1;
    margin-top: calc($arrow-height - $line-size);
    position: relative;
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 0.5em;
      height: 0.5em;
      background-color: $color1;
    }
    &::before {
      top: calc(0px - $arrow-size - 0.5em);
      left: calc(0px - $arrow-size * 2 - 0.5em);
    }
    &::after {
      bottom: calc(0px - $arrow-size - 0.5em);
      left: calc(0px - $arrow-size * 2 - 0.5em);
    }
  }
  .zmd-sidebar-title-arrow-arrow-line {
    $line-width: 1em;
    $size: calc($arrow-size * 2 + $line-width / 2);
    $clip-path: polygon(
      0% 0%,
      100% 50%,
      0% 100%,
      0% calc(100% - calc($line-width / 2)),
      calc(100% - $line-width) 50%,
      0% calc($line-width / 2)
    );
    flex-grow: 0;
    flex-shrink: 0;
    width: $size;
    height: $size;
    margin-left: calc(0px - $arrow-size - $line-width / 2);
    background-color: $color1;
    margin-top: calc($arrow-height - $line-size);
    -webkit-clip-path: $clip-path;
    clip-path: $clip-path;
    transition: transform 0.5s;
  }
}
</style>
