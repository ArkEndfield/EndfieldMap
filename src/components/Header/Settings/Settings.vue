<template>
  <div class="space-y-2">
    <ShowTour v-model:open="open" />
    <ClusteringEnable />
    <ClearCache />
    <ExportData />
    <ImportData />
    <DeleteData />
  </div>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', {
  required: true,
});
</script>

<style lang="scss" scoped></style>
