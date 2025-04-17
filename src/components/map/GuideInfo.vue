<template>
  <div class="flex items-center gap-2">
    <div class="shrink-0">
      <img
        :src="
          props.entity
            ? `/assets/${entityInfo[props.entity.entityDataIdKey].category}/${
                entityInfo[props.entity.entityDataIdKey].entityInfo.pic
              }.png`
            : ''
        "
        class="w-6 h-6 rounded-full"
      />
    </div>
    <div class="truncate overflow-hidden">
      {{
        props.entity
          ? t(
              `sidebar.filter.category.${
                entityInfo[props.entity.entityDataIdKey].category
              }`
            )
          : t('popover.unknow_name')
      }}
    </div>
  </div>
  <div class="!my-2 !text-sm flex flex-wrap items-center gap-2">
    <span class="ml-auto text-zinc-400">id: {{ entity?.levelLogicId }}</span>
  </div>
  <ScrollArea
    class="!min-h-28 max-h-52"
    flex-container
  >
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
import { entityInfo } from '@/data/entity';

const props = defineProps<{
  entity: PointData | null;
}>();

const guide = ref<GuideInfoDetail | null>(null);
const { t } = useI18n();

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
