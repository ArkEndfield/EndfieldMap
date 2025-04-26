<template>
  <div class="zmd-sidebar-title-big-title">
    <div class="zmd-sidebar-title-big-title-line">
      <span>E</span>
      <span>N</span>
      <span class="zmd-sidebar-title-big-title-d">D</span>
      <span>F</span>
      <span>I</span>
      <span class="zmd-sidebar-title-big-title-e">E</span>
      <span class="zmd-sidebar-title-big-title-l">L</span>
      <span>D</span>
    </div>
    <div class="zmd-sidebar-title-big-title-line">
      <span class="zmd-sidebar-title-big-title-m">M</span>
      <span class="zmd-sidebar-title-big-title-a">A</span>
      <span class="zmd-sidebar-title-big-title-p">P</span>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@use '../../../styles/zmd.scss' as zmd;
$square-size: 0.13em;
$square-color: #f9f95759;
$square-color2: zmd.$side-bg-color-start;
.zmd-sidebar-title-big-title {
  width: fit-content;
  font-family: 'Outfit', sans-serif;
  color: #fdfb55;
  font-weight: 700;
  font-size: 2.85em;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.25;
  .zmd-sidebar-title-big-title-line {
    width: fit-content;
    margin-top: -0.45em;
    display: flex;
    span {
      margin-left: -0.08em;
      position: relative;
      &:nth-child(1) {
        margin-left: 0;
      }
      &.zmd-sidebar-title-big-title-d {
        position: relative;
        &:before {
          content: '';
          position: absolute;
          width: calc($square-size * 3 / 4);
          height: $square-size;
          background-color: #424241;
          bottom: calc($square-size + 0.28em);
          left: 0.14em;
        }
      }
      &.zmd-sidebar-title-big-title-e {
        position: relative;
        &:before {
          content: '';
          position: absolute;
          width: $square-size;
          height: calc($square-size * 3 / 4);
          background-color: $square-color2;
          bottom: calc($square-size + 0.4em);
          right: 0.05em;
        }
      }
      &.zmd-sidebar-title-big-title-l {
        position: relative;
        &:before {
          content: '';
          position: absolute;
          width: calc($square-size * 3 / 4);
          height: $square-size;
          background-color: $square-color2;
          bottom: 0.33em;
          right: 0.02em;
        }
      }
      &.zmd-sidebar-title-big-title-m {
        position: relative;
        &:before {
          content: '';
          position: absolute;
          width: calc($square-size * 3 / 4);
          height: $square-size;
          background-color: #3a3a38;
          top: calc($square-size + 0.28em);
          left: 0.06em;
        }
      }
      &.zmd-sidebar-title-big-title-a {
        position: relative;
        &:before {
          content: '';
          position: absolute;
          width: calc($square-size * 3 / 4);
          height: $square-size;
          background-color: #3a3a38;
          bottom: calc($square-size + 0.1em);
          left: -0.07em;
        }
      }

      &.zmd-sidebar-title-big-title-p {
        position: relative;
        &:before {
          content: '';
          position: absolute;
          width: calc($square-size * 3 / 5);
          height: calc($square-size * 3 / 4);
          background-color: #3a3a38;
          top: calc($square-size + 0.45em);
          left: 0.23em;
        }
      }
    }
    &:nth-child(1) {
      margin-top: 0;
      span {
        &:nth-child(1) {
          &:before {
            content: '';
            position: absolute;
            width: $square-size;
            height: $square-size;
            background-color: $square-color;
            top: $square-size;
            left: calc(0.06em - $square-size);
          }
          &:after {
            content: '';
            position: absolute;
            width: $square-size;
            height: $square-size;
            background-color: $square-color;
            bottom: $square-size;
            left: calc(0.06em - $square-size);
          }
        }

        &:nth-last-child(1) {
          &:before {
            content: '';
            position: absolute;
            width: $square-size;
            height: $square-size;
            background-color: $square-color;
            top: $square-size;
            left: calc(0.06em - $square-size);
          }
        }
      }
    }

    &:nth-child(2) {
      span {
        &:nth-child(1) {
          &:after {
            content: '';
            position: absolute;
            width: $square-size;
            height: $square-size;
            background-color: $square-color;
            bottom: $square-size;
            left: calc(0.06em - $square-size);
          }
        }
        &:nth-last-child(1) {
          &:after {
            content: '';
            position: absolute;
            width: $square-size;
            height: $square-size;
            background-color: $square-color;
            bottom: $square-size;
            right: calc(0.06em - $square-size);
          }
        }
      }
    }
  }
}
</style>
