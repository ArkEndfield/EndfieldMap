<template>
  <div>
    {{ props.entity?.entityDataIdKey }}
  </div>
  <button @click="edit">修改</button>
</template>

<script setup lang="ts">
import { updateCustomPoint } from '@/services/customPoints';
import type { PointData } from '@/types/points';

const props = defineProps<{
  entity: PointData | null;
}>();

const edit = () => {
  if (props.entity?.levelLogicId)
    updateCustomPoint(props.entity.levelLogicId, {
      entityDataIdKey: 'custom1',
    });
};
</script>

<style scoped></style>
