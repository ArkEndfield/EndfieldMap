<template>
  <button
    class="absolute bottom-4 left-6 z-[50] w-11 h-11 flex flex-col items-center justify-center rounded-sm bg-[#3E3E3C] text-xs md:hidden"
  >
    <div
      class="absolute -left-1 -right-1 -bottom-1 -top-1 rounded-md border-2 border-[#3E3E3C] z-[-1]"
    ></div>
    <img
      src="/images/map_icon.png"
      alt="map"
      class="shrink w-5 h-5 -mt-1"
    />
    <span class="text-white scale-80 h-2">选项</span>
  </button>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped></style>
