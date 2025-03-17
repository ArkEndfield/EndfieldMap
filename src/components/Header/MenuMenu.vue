<template>
  <Popover class="block md:hidden">
    <button class="text-4xl block cursor-default md:cursor-pointer">
      <MenuIcon />
    </button>
    <template #popover> {{ $t('header.menu') }} </template>
  </Popover>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped></style>
