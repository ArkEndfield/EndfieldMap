<template>
  <div
    class="zmd-sidebar-scroll-list"
    ref="scrollListRef"
  >
    <!-- 添加搜索输入框 -->
    <div class="search-container">
      <input
        type="text"
        v-model="searchQuery"
        :placeholder="$t('search')"
        class="search-input"
      />
      <div
        class="search-clear"
        v-if="searchQuery"
        @click="clearSearch"
      >
        <CloseIcon />
      </div>
    </div>

    <ZmdSidebarItem
      @icon-click="() => toggleSelectAllByCategory(i)"
      :icon-color="getIconColor(i)"
      :open="props.open"
      v-for="(k, i) in filteredCategoryInfo"
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
          @change="refreshMap"
        >
          <img :src="`/assets/${i}/${v.pic}.png`" />
        </ZmdSidebarObject>
      </div>
    </ZmdSidebarItem>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { categoryInfo, entityInfo, isSelectAllByCategory } from '@/data/entity';
import { getCurrentPoints } from '@/services/points';
import { marks } from '@/data/marks';
import { onMarkChange, offMarkChange } from '@/services/marks';
import ZmdSidebarItem from './ZmdSidebarItem.vue';
import ZmdSidebarObject from './ZmdSidebarObject.vue';
import { selectAllByCategory, unSelectByCategory } from '@/services/entity';
import { getCurrentMapId, refreshMap } from '@/services/MapCore';
import type { EntityInfo } from '@/types/entity';

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: true,
  }
);

// 搜索功能
const searchQuery = ref('');
const scrollListRef = ref<HTMLElement | null>(null);

const toggleSelectAllByCategory = (category: string) => {
  const isAllSelected = isSelectAllByCategory(category);
  if (!isAllSelected) {
    selectAllByCategory(category);
  } else {
    unSelectByCategory(category);
  }
};

// 过滤后的类别信息
const filteredCategoryInfo = computed(() => {
  if (!searchQuery.value.trim()) {
    return categoryInfo.value;
  }

  const query = searchQuery.value.toLowerCase().trim();
  const result: Record<string, EntityInfo[]> = {};

  for (const [category, items] of Object.entries(categoryInfo.value)) {
    const filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(query)
    );

    if (filteredItems.length > 0) {
      result[category] = filteredItems;
    }
  }

  return result;
});

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
};

// 创建一个映射来存储每种实体的标记数量
const entityMarkCounts = ref<Record<string, number>>({});

// 计算每个实体类型的标记数量
const calculateEntityMarkCounts = async () => {
  const counts: Record<string, number> = {};

  // 获取当前点位
  const points = await getCurrentPoints();

  // 遍历所有点位
  for (const point of points) {
    const entityKey = point.entityDataIdKey;

    // 如果点位被标记为完成
    if (marks[point.levelLogicId]?.finish) {
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

// 使用onMounted确保组件挂载后注册回调和计算标记数量
onMounted(async () => {
  // 初始计算标记数量
  await calculateEntityMarkCounts();

  // 使用onMarkChange注册标记变更回调
  onMarkChange(calculateEntityMarkCounts);
});

onUnmounted(() => {
  // 清除标记变更回调
  offMarkChange(calculateEntityMarkCounts);
});

// 获取图标颜色的计算属性函数
const getIconColor = (category: string) => {
  return isSelectAllByCategory(category) ? '#f9f853' : '#FFFFFF';
};

watch(
  () => getCurrentMapId(),
  () => {
    calculateEntityMarkCounts();
  }
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
  @media (min-width: 1920px) {
    font-size: large;
  }
  .objecg-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.3em;
    padding-bottom: 0.4em;
  }

  .search-container {
    position: relative;
    margin-bottom: 1.4em;
    padding: 0 0.5em;
    margin-right: 0.25em;

    .search-input {
      width: 100%;
      padding: 0.5em 1.2em;
      padding-left: 2.5em;
      background-color: rgba(40, 40, 40, 0.95);
      color: #e0e0e0;
      border-radius: 6px;
      font-size: 0.8em;
      outline: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      letter-spacing: 0.5px;

      /* 游戏风格边框 */
      border: 1px solid #3a3a3a;
      border-top: 1px solid #333333;
      border-left: 1px solid #333333;

      /* 游戏风格阴影效果 */
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3), inset 0 0 8px rgba(0, 0, 0, 0.2);

      &::placeholder {
        color: #888888;
        font-style: italic;
        transition: all 0.3s ease;
      }

      &:focus {
        background-color: rgba(45, 45, 45, 0.98);
        border: 1px solid #444444;
        border-top: 1px solid #3a3a3a;
        border-left: 1px solid #3a3a3a;
        box-shadow: 0 0 15px rgba(50, 50, 50, 0.3),
          inset 0 0 10px rgba(60, 60, 60, 0.2);

        &::placeholder {
          color: #999999;
          transform: translateX(5px);
        }
      }
    }

    .search-clear {
      position: absolute;
      right: 1.2em;
      top: 50%;
      transform: translateY(-50%);
      width: 1.6em;
      height: 1.6em;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
      color: #a0a0a0;
      font-size: 0.9em;
      transition: all 0.2s ease;
      border: 1px solid #3a3a3a;

      &:hover {
        background: linear-gradient(145deg, #2a2a2a, #3a3a3a);
        color: #e0e0e0;
        box-shadow: 0 0 10px rgba(60, 60, 60, 0.5);
      }

      &:active {
        background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
        transform: translateY(-50%) scale(0.92);
        box-shadow: 0 0 5px rgba(40, 40, 40, 0.3);
      }
    }

    /* 添加搜索图标 */
    &::before {
      content: '';
      position: absolute;
      left: 1.2em;
      top: 50%;
      transform: translateY(-50%);
      width: 1em;
      height: 1em;
      border: 2.5px solid #5a5a5a;
      border-radius: 50%;
      transition: all 0.3s ease;
      z-index: 1;
    }

    /* 聚焦时搜索图标颜色变化 */
    .search-input:focus ~ &::before {
      border-color: #a0a0a0;
    }

    .search-input:focus ~ &::after {
      background-color: #a0a0a0;
    }

    /* 添加高科技边缘发光效果 */
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0.5em;
      right: 0.3em;
      bottom: 0;
      border-radius: 6px;
      box-shadow: 0 0 2px rgba(120, 120, 120, 0.15);
      pointer-events: none;
      z-index: -1;
    }
  }
}
</style>
