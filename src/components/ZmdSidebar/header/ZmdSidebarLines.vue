<template>
  <motion.div
    class="zmd-sidebar-lines"
    :animate="{
      x: props.open ? '0%' : '-130%',
    }"
    :initial="{
      x: '-130%',
    }"
    :transition="{
      duration: 0.5,
      type: 'spring',
      bounce: 0.25,
    }"
  >
    <div class="zmd-sidebar-line">
      <span
        v-for="item of Array(7).map((_, i) => i)"
        :key="item"
      >
      </span>
    </div>
    <div class="zmd-sidebar-line">
      <span
        v-for="item of Array(6).map((_, i) => i)"
        :key="item"
      >
      </span>
    </div>
    <div class="zmd-sidebar-line">
      <span
        v-for="item of Array(5).map((_, i) => i)"
        :key="item"
      >
      </span>
    </div>
    <div class="zmd-sidebar-line">
      <span
        v-for="item of Array(7).map((_, i) => i)"
        :key="item"
      >
      </span>
    </div>
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);
</script>

<style lang="scss" scoped>
@use '@/styles/zmd.scss' as zmd;

.zmd-sidebar-lines {
  width: 8.4em;
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  .zmd-sidebar-line {
    height: 1.5px;
    display: flex;
    span {
      height: 1.5px;
      background-color: #737474;
      border-radius: 1.5px;
      @media screen and (width >= zmd.$phone-width) {
        animation: shin 1.5s infinite;
      }
    }
    &:nth-child(1) {
      span:nth-child(1) {
        width: 6.2%;
        margin-right: 1%;
        animation-duration: 2.2s;
        animation-delay: 0.3s;
      }
      span:nth-child(2) {
        width: 6.2%;
        margin-right: 3%;
        animation-duration: 1.8s;
        animation-delay: 0.7s;
      }
      span:nth-child(3) {
        width: 28%;
        margin-right: 3%;
        animation-duration: 3s;
        animation-delay: 0.2s;
      }
      span:nth-child(4) {
        width: 9%;
        margin-right: 4%;
        animation-duration: 2.5s;
        animation-delay: 1.1s;
      }
      span:nth-child(5) {
        width: 4%;
        margin-right: 1%;
        animation-duration: 1.7s;
        animation-delay: 0.5s;
      }
      span:nth-child(6) {
        width: 11%;
        margin-right: 1%;
        animation-duration: 2.8s;
        animation-delay: 0.9s;
      }
      span:nth-child(7) {
        width: 8%;
        animation-duration: 2.1s;
        animation-delay: 0.4s;
      }
    }
    &:nth-child(2) {
      span:nth-child(1) {
        width: 6.2%;
        margin-right: 1%;
        animation-duration: 2.3s;
        animation-delay: 0.6s;
      }
      span:nth-child(2) {
        width: 23%;
        margin-right: 1%;
        animation-duration: 1.9s;
        animation-delay: 1.2s;
      }
      span:nth-child(3) {
        width: 10%;
        margin-right: 3%;
        animation-duration: 2.7s;
        animation-delay: 0.3s;
      }
      span:nth-child(4) {
        width: 11%;
        margin-right: 1%;
        animation-duration: 2.2s;
        animation-delay: 0.8s;
      }
      span:nth-child(5) {
        width: 14%;
        margin-right: 1%;
        animation-duration: 3.1s;
        animation-delay: 0.2s;
      }
      span:nth-child(6) {
        width: 8%;
        margin-right: 1%;
        animation-duration: 1.6s;
        animation-delay: 1s;
      }
    }
    &:nth-child(3) {
      span:nth-child(1) {
        width: 53%;
        margin-right: 1%;
        animation-duration: 2.6s;
        animation-delay: 0.5s;
      }
      span:nth-child(2) {
        width: 12%;
        margin-right: 5%;
        animation-duration: 1.8s;
        animation-delay: 1.3s;
      }
      span:nth-child(3) {
        width: 5%;
        margin-right: 1%;
        animation-duration: 2.9s;
        animation-delay: 0.1s;
      }
      span:nth-child(4) {
        width: 12%;
        margin-right: 1%;
        animation-duration: 2.4s;
        animation-delay: 0.9s;
      }
      span:nth-child(5) {
        width: 9%;
        margin-right: 1%;
        animation-duration: 2s;
        animation-delay: 0.7s;
      }
    }
    &:nth-child(4) {
      span:nth-child(1) {
        width: 6.2%;
        margin-right: 1%;
        animation-duration: 2.5s;
        animation-delay: 0.4s;
      }
      span:nth-child(2) {
        width: 6.2%;
        margin-right: 3%;
        animation-duration: 1.9s;
        animation-delay: 1.1s;
      }
      span:nth-child(3) {
        width: 28%;
        margin-right: 2.7%;
        animation-duration: 2.7s;
        animation-delay: 0.2s;
      }
      span:nth-child(4) {
        width: 9%;
        margin-right: 3.8%;
        animation-duration: 2.3s;
        animation-delay: 0.8s;
      }
      span:nth-child(5) {
        width: 4%;
        margin-right: 1%;
        animation-duration: 3.2s;
        animation-delay: 0.5s;
      }
      span:nth-child(6) {
        width: 11%;
        margin-right: 1%;
        animation-duration: 1.7s;
        animation-delay: 1.2s;
      }
      span:nth-child(7) {
        width: 8%;
        animation-duration: 2.1s;
        animation-delay: 0.3s;
      }
    }
    @keyframes shin {
      0% {
        background-color: #737474;
        opacity: 0.7;
      }
      50% {
        background-color: #a0a0a0;
        opacity: 1;
      }
      100% {
        background-color: #737474;
        opacity: 0.7;
      }
    }
  }
}
</style>
