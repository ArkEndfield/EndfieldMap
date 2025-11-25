import type { Category, EntityInfoItemData } from '@endfieldmap/map-core';
import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import EntityGroup from './group';
import EntityItem from './item';
import { Search } from './search';
import { useAdapter } from '@/hooks/use_adapter';

interface EntityItemInfo extends EntityInfoItemData {
  markedCount: number;
}

interface CategoryInfo {
  category: Category;
  entities: EntityItemInfo[];
  totalEntities: number;
  displayedEntities: number;
  allDisplayed: boolean;
}

/**
 * 实体面板组件
 * 显示当前地图的所有实体，支持按分类显示/隐藏
 */
const EntityPanel = observer(() => {
  const { t } = useTranslation(['sidebar']);
  const { adapter } = useAdapter();
  const [searchQuery, setSearchQuery] = useState('');

  // 获取实体控制器相关方法，如果 adapter 为 null 则提供空函数
  const entities = adapter.entityController.currentEntityInfoList;
  const currentMap = adapter.currentMapIndex;

  // 计算每个实体的 marked 数量并按分类分组
  const categorizedEntities = useMemo<CategoryInfo[]>(() => {
    if (!entities.length) return [];

    const lowerSearchQuery = searchQuery.toLowerCase().trim();

    // 构建实体信息映射
    const entityInfoMap = new Map<string, EntityItemInfo>();

    entities.forEach((entity) => {
      // 如果有搜索条件，进行过滤
      if (lowerSearchQuery) {
        const entityIdKey = entity.entityDataIdKey.toLowerCase();
        const translatedEntityName = String(t(entity.entityDataIdKey as never)).toLowerCase();
        const category = entity.category.toLowerCase();
        const translatedCategory = t(`sidebar:filter.category.${entity.category}`).toLowerCase();

        const matches =
          entityIdKey.includes(lowerSearchQuery) ||
          translatedEntityName.includes(lowerSearchQuery) ||
          category.includes(lowerSearchQuery) ||
          translatedCategory.includes(lowerSearchQuery);

        if (!matches) return;
      }

      entityInfoMap.set(entity.entityDataIdKey, entity);
    });

    // 按 category 分组
    const categoryMap = new Map<Category, EntityItemInfo[]>();
    entityInfoMap.forEach((entity) => {
      const category = entity.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(entity);
    });

    // 转换为 CategoryInfo 数组
    const result: CategoryInfo[] = [];
    categoryMap.forEach((entities, category) => {
      const displayedEntities = entities.filter((e) => e.visible).length;
      const totalEntities = entities.length;
      const allDisplayed = displayedEntities === totalEntities;

      result.push({
        category,
        entities,
        totalEntities,
        displayedEntities,
        allDisplayed,
      });
    });

    // 按 category 名称排序
    result.sort((a, b) => a.category.localeCompare(b.category));

    return result;
  }, [entities, searchQuery, t]);

  // 切换分类显示/隐藏
  const handleCategoryClick = (category: Category, allDisplayed: boolean) => {
    if (allDisplayed) {
      adapter.entityController.hideCategoryEntities(category);
    } else {
      adapter.entityController.showCategoryEntities(category);
    }
  };

  if (!currentMap) {
    return <div className="p-4 text-gray-500">初始化中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 搜索输入框 */}
      <div className="px-2 pt-1">
        <Search
          value={searchQuery}
          onValueChange={(v) => setSearchQuery(v)}
          placeholder={t('sidebar:filter.search_placeholder')}
        />
      </div>

      {categorizedEntities.map((categoryInfo) => (
        <EntityGroup
          key={categoryInfo.category}
          title={t(`filter.category.${categoryInfo.category}`)}
          subtitle={categoryInfo.category}
          onIconClick={() => handleCategoryClick(categoryInfo.category, categoryInfo.allDisplayed)}
          iconColor={categoryInfo.allDisplayed ? '#f9f853' : '#ffffff'}
        >
          {/* {categoryInfo.displayedEntities}/{categoryInfo.totalEntities} */}
          {/* 实体列表 */}
          <div className='grid grid-cols-2 gap-2 py-2'>
            {categoryInfo.entities.map((entity) => (
              <EntityItem
                key={entity.entityDataIdKey}
                entity={entity}
                category={categoryInfo.category}
                active={entity.visible}
                onClick={() => adapter.entityController.toggleEntityVisible(entity.entityDataIdKey)}
                hideCount={false}
              />
            ))}
          </div>
        </EntityGroup>
      ))}
    </div>
  );
});

export default EntityPanel;
