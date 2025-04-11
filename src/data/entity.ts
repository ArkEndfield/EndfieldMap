import { computed, reactive } from 'vue';
import type {
  EntityCategories,
  EntityCategory,
  EntityInfo,
} from '@/types/entity';

// 实体信息
export const entityInfo: EntityCategories = reactive({});

// 选择 callbacks
export const selectCallbacks: (() => void)[] = [];

export const isSelectAll = computed(() => {
  return Object.keys(entityInfo).every(key => entityInfo[key].entityInfo.show);
});

// 计算属性：获取分类信息
export const categoryInfo = computed(() => {
  // 定义类别顺序
  const categoryOrder: EntityCategory[] = [
    'settlement', // 定居点
    'dungeon', // 副本点位
    'chest', // 宝箱
    'mineral', // 矿物
    'spcstone', // 稀有矿物
    'plant', // 植物类素材
    'ether', // 醚质
    'enemy', // 敌人
    'special', // 特殊点位
  ];

  // 创建一个有序的分类对象
  const categories: Record<string, EntityInfo[]> = {};

  // 先按照顺序初始化所有分类
  categoryOrder.forEach(category => {
    categories[category] = [];
  });

  // 将实体信息填充到对应分类中，只包含 count > 0 的实体
  for (const key in entityInfo) {
    const entity = entityInfo[key];
    if (entity.entityInfo.count > 0) {
      // 只处理 count > 0 的实体
      const category = entity.category;
      if (categories[category]) {
        categories[category].push(entity.entityInfo);
      }
    }
  }

  // 过滤掉空的分类
  const filteredCategories: Record<string, EntityInfo[]> = {};
  categoryOrder.forEach(category => {
    if (categories[category].length > 0) {
      filteredCategories[category] = categories[category];
    }
  });

  return filteredCategories;
});

// 一大类实体是否全选
export const isSelectAllByCategory = (category: string) => {
  return Object.keys(entityInfo).every(key => {
    if (
      entityInfo[key].category === category &&
      entityInfo[key].entityInfo.count > 0
    ) {
      return entityInfo[key].entityInfo.show;
    }
    return true;
  });
};
