<template>
  <div class="mb-2">
    <div class="text-lg font-bold">
      <slot>Title</slot>
    </div>
    <div class="h-2 flex items-stretch">
      <div class="w-18 bg-[#434343]"></div>
      <div
        class="flex-1 bg-[linear-gradient(-45deg,#434343,#43434300_20.58050117%,#434343_0,#434343_29.41949883%,#43434300_0,#43434300_70.58050117%,#434343_0,#434343_79.41949883%,#43434300_0,#43434300)] bg-repeat [background-size:0.2em_0.2em]"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped></style>
