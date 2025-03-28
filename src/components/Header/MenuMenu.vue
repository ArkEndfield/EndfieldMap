<template>
  <Popover
    class="block md:hidden"
    placement="top"
  >
    <button
      class="text-3xl drop-shadow-[0_0_0.3em_rgba(0,0,0,0.5)] flex flex-col gap-1"
    >
      <span class="h-0.5 w-4 bg-white"></span>
      <span class="h-0.5 w-4 bg-white"></span>
      <span class="h-0.5 w-4 bg-white"></span>
    </button>
    <template #popover> {{ $t('header.menu') }} </template>
  </Popover>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped></style>
