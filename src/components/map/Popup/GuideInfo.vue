<template>
  <div class="flex items-center gap-2 px-4">
    <div class="shrink-0">
      <img
        :src="
          props.point
            ? `/assets/${entityInfo.category}/${entityInfo.entityInfo.pic}.png`
            : ''
        "
        class="w-6 h-6 rounded-full"
      />
    </div>
    <div class="truncate overflow-hidden">
      {{
        props.point
          ? t(`entities.${entityInfo.entityInfo.point}`)
          : t('popover.unknow_name')
      }}
    </div>
  </div>
  <div class="!my-2 !text-sm flex flex-wrap items-center gap-2 px-4">
    <span class="ml-auto text-zinc-400">id: {{ point.levelLogicId }}</span>
  </div>
  <ScrollArea
    class="!min-h-28 max-h-52 px-4"
    flex-container
  >
    <DungeonDesc
      v-if="entityInfo.category === 'dungeon' && point.dungeion_series_id"
      :point="point"
    />
    <div
      v-else-if="entityInfo.category === 'enemy'"
      class="enemy-description"
    >
      {{ t(`enemy.${point.entityDataIdKey}.description`) }}
    </div>
    <GuideNode
      v-if="point && guide?.nodes"
      :nodes="guide.nodes"
    />
  </ScrollArea>
  <div
    v-if="guide?.video?.link"
    class="mt-4 px-4"
  >
    <a
      :href="guide.video.link"
      target="_blank"
      class="text-[#ece065] text-sm px-3 py-1 bg-black/20 rounded-md hover:bg-black/30 transition-colors"
    >
      {{ t('popover.video_link') }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { type GuideInfoDetail } from '@/types/guides';
import { type PointData } from '@/types/points';
import { getGuide } from '@/services/guides';
import { useI18n } from 'vue-i18n';
import { entityInfo as entityInfoData } from '@/data/entity';
import { computed } from 'vue';

const props = defineProps<{
  point: PointData;
}>();

const guide = ref<GuideInfoDetail | null>(null);
const { t } = useI18n();

const entityInfo = computed(() => {
  return entityInfoData[props.point.entityDataIdKey];
});

// 监听 point 变化以异步加载攻略数据
watch(
  () => props.point,
  async newPoint => {
    if (newPoint) {
      guide.value = await getGuide(newPoint.levelLogicId);
    } else {
      guide.value = null;
    }
  }
);

// 初始加载
onMounted(async () => {
  if (props.point) {
    guide.value = await getGuide(props.point.levelLogicId);
  }
});
</script>

<style lang="scss" scoped>
.enemy-description {
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.625;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  color: #f8b88b;
  background: linear-gradient(
    90deg,
    rgba(248, 184, 139, 0.1),
    rgba(0, 0, 0, 0.3)
  );
  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
}
</style>
