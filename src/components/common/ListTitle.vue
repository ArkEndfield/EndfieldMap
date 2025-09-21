<template>
  <div class="relative pt-3">
    <div class="flex items-end title-wrapper">
      <div
        class="relative flex-1 title-container"
        :class="{
          'title-baracket': props.bracket,
        }"
      >
        <div
          class="absolute w-fit bottom-0 left-0 text-center bg-clip-text bg-repeat text-transparent [background-size:0.1em_0.1em] opacity-50 translate-x-1 font-bold back-title"
          :style="{ fontSize: props.backTitleFontSize }"
        >
          <slot name="backTitle"></slot>
        </div>
        <div
          class="font-bold w-fit"
          :style="{ fontSize: props.titleFontSize }"
        >
          <slot></slot>
        </div>
      </div>
      <slot name="right"></slot>
    </div>
    <div class="flex h-2 items-stretch" v-if="props.solid">
      <div class="title-line-solid"></div>
      <div
        class="flex-1 bg-repeat [background-size:0.2em_0.2em] title-line-dashed"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// props 传入 color，默认为 #FDFD59
const props = withDefaults(defineProps<{
  color?: string;
  solidWidth?: string | number;
  solid?: boolean;
  bracket?: boolean;
  titleFontSize?: string;
  backTitleFontSize?: string;
}>(), {
  color: '#FDFD59',
  solidWidth: '2rem',
  solid: true,
  bracket: false,
  titleFontSize: '1.5rem',
  backTitleFontSize: '2.25rem',
});
</script>

<style lang="scss" scoped>
.title-wrapper {
  margin-left: v-bind("props.solid ? props.solidWidth : 0");
}
.title-container {
  color: v-bind("props.color");
  &.title-baracket {
    width: fit-content;
    padding: 0 0.5rem;
    flex: unset;
    margin-right: auto;
    position: relative;
    &::before, &::after {
      content: '';
      position: absolute;
      bottom: 0.25em;
      width: 0.3rem;
      height: 1em;
      border: 3px solid v-bind("props.color");
    }
    &::before {
      left: 0;
      border-right: none;
    }
    &::after {
      right: 0;
      border-left: none;
    }
  }
}
.back-title {
  background-image: linear-gradient(-45deg, v-bind("props.color"), transparent 20.58050117%, v-bind("props.color") 0, v-bind("props.color") 29.41949883%, transparent 0, transparent 70.58050117%, v-bind("props.color") 0, v-bind("props.color") 79.41949883%, transparent 0, transparent);
}
.title-line-solid {
  width: v-bind("props.solidWidth");
  background-color: v-bind("props.color");
}
.title-line-dashed {
  background-image: linear-gradient(-45deg, v-bind("props.color"), transparent 20.58050117%, v-bind("props.color") 0, v-bind("props.color") 29.41949883%, transparent 0, transparent 70.58050117%, v-bind("props.color") 0, v-bind("props.color") 79.41949883%, transparent 0, transparent);
}
</style>