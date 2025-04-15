<template>
  <ZmdSidebarObject
    :entity="entity.entityInfo"
    :category="entity.category"
    :hide-count="true"
  />
</template>

<script setup lang="ts">
import type { EntityCategories } from '@/types/entity';

defineProps<{
  entity: EntityCategories[string];
}>();
</script>

<style scoped></style>
