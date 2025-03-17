<template>
  <div
    class="zmd-sidebar-lines"
    ref="linesRef"
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
  </div>
</template>

<script setup lang="ts">
import { animate, spring } from 'motion';
import { ref } from 'vue';
import { nextTick } from 'vue';
import { onMounted } from 'vue';

const isInitialRender = ref(true);
const linesRef = ref<HTMLElement>();

onMounted(async () => {
  if (isInitialRender.value) {
    await nextTick();

    const linesEl = linesRef.value;
    if (linesEl) {
      linesEl.style.transform = 'translateX(-130%)';

      await animate(
        linesEl,
        { x: '0%' },
        { duration: 0.5, type: spring, bounce: 0.4 }
      );
    }

    isInitialRender.value = false;
  }
});
</script>

<style lang="scss" scoped>
@use '../../../styles/zmd.scss' as zmd;

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
    }
    &:nth-child(1) {
      span:nth-child(1) {
        width: 6.2%;
        margin-right: 1%;
      }
      span:nth-child(2) {
        width: 6.2%;
        margin-right: 3%;
      }
      span:nth-child(3) {
        width: 28%;
        margin-right: 3%;
      }
      span:nth-child(4) {
        width: 9%;
        margin-right: 4%;
      }
      span:nth-child(5) {
        width: 4%;
        margin-right: 1%;
      }
      span:nth-child(6) {
        width: 11%;
        margin-right: 1%;
      }
      span:nth-child(7) {
        width: 8%;
      }
    }
    &:nth-child(2) {
      span:nth-child(1) {
        width: 6.2%;
        margin-right: 1%;
      }
      span:nth-child(2) {
        width: 23%;
        margin-right: 1%;
      }
      span:nth-child(3) {
        width: 10%;
        margin-right: 3%;
      }
      span:nth-child(4) {
        width: 11%;
        margin-right: 1%;
      }
      span:nth-child(5) {
        width: 14%;
        margin-right: 1%;
      }
      span:nth-child(6) {
        width: 8%;
        margin-right: 1%;
      }
    }
    &:nth-child(3) {
      span:nth-child(1) {
        width: 53%;
        margin-right: 1%;
      }
      span:nth-child(2) {
        width: 12%;
        margin-right: 5%;
      }
      span:nth-child(3) {
        width: 5%;
        margin-right: 1%;
      }
      span:nth-child(4) {
        width: 12%;
        margin-right: 1%;
      }
      span:nth-child(5) {
        width: 9%;
        margin-right: 1%;
      }
    }
    &:nth-child(4) {
      span:nth-child(1) {
        width: 6.2%;
        margin-right: 1%;
      }
      span:nth-child(2) {
        width: 6.2%;
        margin-right: 3%;
      }
      span:nth-child(3) {
        width: 28%;
        margin-right: 2.7%;
      }
      span:nth-child(4) {
        width: 9%;
        margin-right: 3.8%;
      }
      span:nth-child(5) {
        width: 4%;
        margin-right: 1%;
      }
      span:nth-child(6) {
        width: 11%;
        margin-right: 1%;
      }
      span:nth-child(7) {
        width: 8%;
      }
    }
  }
}
</style>
