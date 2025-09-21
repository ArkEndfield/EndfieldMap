import { computed, reactive, ref, watch } from 'vue';
import type {
  EntityCategories,
  EntityCategory,
  EntityInfo,
  EntityShowStates,
} from '@/types/entity';
import { DATA_DB_KEY } from '@/constants/db_key';
import { getItem, setItem } from '@/utils/indexedDBStorage';
import { debounce } from '@/utils/common';
import type { CustomPointKey } from '@/types/customPoints';

// 显示培养素材快速筛选
export const showCultivationMaterial = ref(false);

// 实体信息
export const entityInfo: EntityCategories = reactive({});

// 实体显示状态
export const entityShowStates: EntityShowStates = reactive({});

// 所有自定义标点类型
export const customPointTypes: CustomPointKey[] = [
  'electric_pole',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
];

// 自定义实体
export const customEntityInfo = customPointTypes.reduce((acc, type) => {
  acc[type] = {
    entityInfo: {
      pic: type === 'electric_pole' ? 'electric_pole' : `camp_zone_${type}`,
      count: 0,
      point: type,
    },
    category: 'custom',
  };
  return acc;
}, {} as EntityCategories);

export const isSelectAll = computed(() => {
  return Object.keys(entityInfo).every(key => entityShowStates[key]);
});

// 计算属性：获取分类信息
export const categoryInfo = computed(() => {
  // 定义类别顺序
  const categoryOrder: EntityCategory[] = [
    'custom', // 自定义点位
    'ether', // 醚质
    'chest', // 宝箱
    'settlement', // 定居点
    'spcstone', // 稀有矿物
    'plant', // 植物类素材
    'narrative', // 世界叙事碎片
    'dnarrative', // 世界叙事回响
    'special', // 特殊点位
    'dungeon', // 副本点位
    'mineral', // 矿物
    'enemy', // 敌人
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
    const category = entity.category;
    if (categories[category]) {
      categories[category].push(entity.entityInfo);
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
      return entityShowStates[key];
    }
    return true;
  });
};

// 保存实体显示状态到数据库
const saveEntityShowStates = debounce(async () => {
  const plainStates = { ...entityShowStates };
  await setItem(DATA_DB_KEY.ENTITY_SHOW_STATES, plainStates);
}, 500);

// 监听实体显示状态变化并保存到数据库
watch(
  entityShowStates,
  () => {
    saveEntityShowStates();
  },
  { deep: true }
);

// 初始化实体显示状态
export const initializeEntityShowStates = async () => {
  const savedStates = await getItem<EntityShowStates>(
    DATA_DB_KEY.ENTITY_SHOW_STATES
  );
  if (savedStates) {
    Object.keys(savedStates).forEach(key => {
      entityShowStates[key] = savedStates[key];
    });
  }
};
