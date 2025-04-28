<template>
  <div class="space-y-2">
    <div class="dungeon-description">
      {{ t(`dungeon.${point.dungeion_series_id}.desc`) }}
    </div>
    <div
      v-for="i in includeDungeonCount"
      :key="i"
      class="dungeon-description sub-description"
    >
      {{
        t(
          `dungeon.${point.dungeion_series_id}.includeDungeon.${
            i - 1
          }.dungeonDesc`
        )
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { getIncludeDungeonCount } from '@/services/reward';
import type { PointData } from '@/types/points';
import { watch } from 'vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  point: PointData;
}>();

const { t } = useI18n();

const includeDungeonCount = ref(0);

watch(
  () => props.point,
  async newPoint => {
    includeDungeonCount.value = await getIncludeDungeonCount(newPoint);
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.dungeon-description {
  color: #8ab4f8;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.625;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  background: linear-gradient(
    90deg,
    rgba(138, 180, 248, 0.1),
    rgba(0, 0, 0, 0.3)
  );
  &.sub-description {
    padding: 0.5rem;
    font-size: 0.75rem;
    background: linear-gradient(
      90deg,
      rgba(138, 180, 248, 0.1),
      rgba(0, 0, 0, 0.3)
    );
    color: #5f82ba;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
}
</style>
