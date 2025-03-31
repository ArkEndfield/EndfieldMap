<template>
  <div
    class="zmd-sidebar-scroll-list"
    ref="scrollListRef"
  >
    <ZmdSidebarItem
      icon-color="#FFFFFF"
      :open="props.open"
      v-for="(k, i) in categoryInfo"
    >
      <template #title> {{ $t(`sidebar.filter.category.${i}`) }} </template>
      <template #subtitle> {{ i }} </template>
      <div class="objecg-list">
        <ZmdSidebarObject
          v-for="v in k"
          :name="v.name"
          :value="v.count"
          :mark-count="getMarkCountForEntity(i, v.name)"
          v-model="v.show"
          @change="refresh"
        >
          <img :src="`/assets/${i}/${v.pic}.png`" />
        </ZmdSidebarObject>
      </div>
    </ZmdSidebarItem>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { categoryInfo, refresh, entityInfo } from '@/data/entity';
import { points } from '@/data/points';
import { marks, markStateChangeTrigger, onMarkChange } from '@/data/marks';
import ZmdSidebarItem from './ZmdSidebarItem.vue';
import ZmdSidebarObject from './ZmdSidebarObject.vue';

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);

// 创建一个映射来存储每种实体的标记数量
const entityMarkCounts = ref<Record<string, number>>({});

// 计算每个实体类型的标记数量
const calculateEntityMarkCounts = () => {
  const counts: Record<string, number> = {};

  // 遍历所有点位
  for (const point of points) {
    const entityKey = point.entityDataIdKey;

    // 如果点位被标记为完成
    if (marks[point.seq]?.finish) {
      counts[entityKey] = (counts[entityKey] || 0) + 1;
    }
  }

  entityMarkCounts.value = counts;
};

// 获取特定实体类型的标记数量
const getMarkCountForEntity = (category: string, name: string) => {
  // 找到对应的实体key
  const entityKey = Object.keys(entityInfo).find(
    key =>
      entityInfo[key].category === category &&
      entityInfo[key].entityInfo.name === name
  );

  if (!entityKey) return 0;

  return entityMarkCounts.value[entityKey] || 0;
};

// 初始计算标记数量
calculateEntityMarkCounts();

// 使用onMounted确保组件挂载后注册回调
onMounted(() => {
  // 使用onMarkChange注册标记变更回调
  onMarkChange(() => {
    calculateEntityMarkCounts();
  });
});

// 同时监听标记状态变化触发器
watch(
  markStateChangeTrigger,
  () => {
    calculateEntityMarkCounts();
  },
  { immediate: true }
);

// 监听points变化，当地图切换时重新计算
watch(
  () => points.length,
  () => {
    calculateEntityMarkCounts();
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.zmd-sidebar-scroll-list {
  margin-top: 0.8em;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: relative;
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
  .objecg-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.3em;
    padding-bottom: 0.4em;
  }
}
</style>
