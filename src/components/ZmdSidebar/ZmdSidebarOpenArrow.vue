<template>
  <div class="zmd-sidebar-open-arrow">
    <div class="zmd-sidebar-open-arrow-end-part">
      <div class="zmd-sidebar-open-arrow-bg-title">UNFOLD</div>
      <div class="zmd-sidebar-open-arrow-title">{{ $t('sidebar.unfold') }}</div>
    </div>
    <div class="zmd-sidebar-open-arrow-arrow-part"></div>
    <div class="zmd-sidebar-open-arrow-arrow-line"></div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@use '../../styles/zmd.scss' as zmd;

$color1: #3a3a38;
$arrow-size: 1.5em;
$line-size: 1.8em;
$arrow-height: 5em;
.zmd-sidebar-open-arrow {
  display: flex;
  justify-content: start;
  align-items: center;
  position: fixed;
  left: 0;
  top: calc(zmd.$side-margin-y + 20%);
  width: 9em;
  z-index: 19;
  transition: filter 0.3s, width 0.3s;
  &:hover {
    width: 10em;
    filter: drop-shadow(0 0 1em rgba(0, 0, 0, 0.3));
  }
  @media screen and (max-width: zmd.$phone-width) {
    width: 5em;
    top: 20%;
    transform: translateY(-50%);
  }
  .zmd-sidebar-open-arrow-end-part {
    flex: 1;
    height: $line-size;
    background-color: $color1;
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
    }
    .zmd-sidebar-open-arrow-title {
      z-index: 1;
    }
  }
  .zmd-sidebar-open-arrow-arrow-part {
    flex-grow: 0;
    flex-shrink: 0;
    width: 0;
    height: 0;
    border-top: $arrow-size solid transparent;
    border-bottom: $arrow-size solid transparent;
    border-left: calc($arrow-size * 2) solid $color1;
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
  .zmd-sidebar-open-arrow-arrow-line {
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
    -webkit-clip-path: $clip-path;
    clip-path: $clip-path;
  }

  @media screen and (max-width: zmd.$phone-width) {
    $arrow-size: 1.5em;
    $line-size: 2em;
    .zmd-sidebar-open-arrow-end-part {
      height: $line-size;
    }
    .zmd-sidebar-open-arrow-arrow-part {
      margin-left: -1em;
      border-top: $arrow-size solid transparent;
      border-bottom: $arrow-size solid transparent;
      border-left: calc($arrow-size * 2) solid $color1;
      &::before,
      &::after {
        width: 0.3em;
        height: 0.3em;
      }
      &::before {
        top: calc(0px - $arrow-size - 0.3em);
        left: calc(0px - $arrow-size * 2 - 0.3em);
      }
      &::after {
        bottom: calc(0px - $arrow-size - 0.3em);
        left: calc(0px - $arrow-size * 2 - 0.3em);
      }
    }
    .zmd-sidebar-open-arrow-arrow-line {
      $line-width: 0.5em;
      $size: calc($arrow-size + $line-width * 3);
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
      background-color: $color1;
      -webkit-clip-path: $clip-path;
      clip-path: $clip-path;
      margin-left: calc(0px - $arrow-size - $line-width * 1.5);
    }
  }
}
</style>
