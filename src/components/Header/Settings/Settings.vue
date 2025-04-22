<template>
  <div class="space-y-2">
    <ShowTour v-model:open="open" />
    <ClusteringEnable />
    <AdjustPosition />
    <ClearCache />
    <ExportData />
    <ImportData />
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <TpCenter />
      <DeleteData />
    </div>
  </div>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', {
  required: true,
});
</script>

<style lang="scss" scoped></style>
