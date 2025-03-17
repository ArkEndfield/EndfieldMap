<template>
  <Popover
    class="block md:hidden"
    placement="top"
  >
    <button
      class="text-3xl block drop-shadow-[0_0_0.3em_rgba(0,0,0,0.5)] cursor-default md:cursor-pointer"
    >
      <MenuIcon />
    </button>
    <template #popover> {{ $t('header.menu') }} </template>
  </Popover>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped></style>
