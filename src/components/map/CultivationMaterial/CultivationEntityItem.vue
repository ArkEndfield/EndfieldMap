<template>
  <ZmdSidebarObject
    :name="t(`entities.${entity.entityInfo.point}`)"
    :checked="entity.entityInfo.show"
    @change="toggle"
    :hide-count="true"
  >
    <img :src="`/assets/${entity.category}/${entity.entityInfo.pic}.png`" />
  </ZmdSidebarObject>
</template>

<script setup lang="ts">
import { toggleSelect } from '@/services/entity';
import type { EntityCategories } from '@/types/entity';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  entity: EntityCategories[string];
}>();
const toggle = () => {
  toggleSelect(props.entity.entityInfo.point);
};
</script>

<style scoped></style>
