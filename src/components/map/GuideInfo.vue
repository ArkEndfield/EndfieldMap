<template>
  <div class="flex items-center gap-2">
    <div class="shrink-0">
      <img
        :src="
          props.entity
            ? `/assets/${entityInfo.category}/${entityInfo.entityInfo.pic}.png`
            : ''
        "
        class="w-6 h-6 rounded-full"
      />
    </div>
    <div class="truncate overflow-hidden">
      {{
        props.entity
          ? t(`entities.${entityInfo.entityInfo.point}`)
          : t('popover.unknow_name')
      }}
    </div>
  </div>
  <div class="!my-2 !text-sm flex flex-wrap items-center gap-2">
    <span class="ml-auto text-zinc-400">id: {{ entity.levelLogicId }}</span>
  </div>
  <ScrollArea
    class="!min-h-28 max-h-52"
    flex-container
  >
    <div
      v-if="entityInfo.category === 'dungeon' && entity.dungeion_series_id"
      class="game-description dungeon-description"
    >
      {{ t(`dungeon.${entity.dungeion_series_id}.desc`) }}
    </div>
    <div
      v-else-if="entityInfo.category === 'enemy'"
      class="game-description enemy-description"
    >
      {{ t(`enemy.${entity.entityDataIdKey}.description`) }}
    </div>
    <GuideNode
      v-if="entity && guide?.nodes"
      :nodes="guide.nodes"
    />
  </ScrollArea>
  <div
    v-if="guide?.video?.link"
    class="mt-4"
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
  entity: PointData;
}>();

const guide = ref<GuideInfoDetail | null>(null);
const { t } = useI18n();

const entityInfo = computed(() => {
  return entityInfoData[props.entity.entityDataIdKey];
});

// 监听 entity 变化以异步加载攻略数据
watch(
  () => props.entity,
  async newEntity => {
    if (newEntity) {
      guide.value = await getGuide(newEntity.levelLogicId);
    } else {
      guide.value = null;
    }
  }
);

// 初始加载
onMounted(async () => {
  if (props.entity) {
    guide.value = await getGuide(props.entity.levelLogicId);
  }
});
</script>

<style scoped>
.game-description {
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.625;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.dungeon-description {
  color: #8ab4f8;
  background: linear-gradient(
    90deg,
    rgba(138, 180, 248, 0.1),
    rgba(0, 0, 0, 0.3)
  );
}

.enemy-description {
  color: #f8b88b;
  background: linear-gradient(
    90deg,
    rgba(248, 184, 139, 0.1),
    rgba(0, 0, 0, 0.3)
  );
}

.game-description:hover {
  background: rgba(0, 0, 0, 0.4);
}
</style>
