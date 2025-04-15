<template>
  <div class="min-h-32">
    <GuideNode
      v-if="entity && guide?.nodes"
      :nodes="guide.nodes"
    />
  </div>
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
