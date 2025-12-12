import type { Category, EntityInfoItemData } from '@endfieldmap/map-core';
import EntityGroup from '@themes/blur/control_panel/controllers/entity_panel/group';
import EntityItem from '@themes/blur/control_panel/controllers/entity_panel/item';
import { Search } from '@themes/blur/control_panel/controllers/entity_panel/search';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

const EntityPanel = observer(() => {
  const { t } = useTranslation(['sidebar', 'entity_info']);
  const { adapter } = useAdapter();
  const [searchQuery, setSearchQuery] = useState('');

  const entities = adapter.entityController.currentEntityInfoList;
  const currentMap = adapter.currentMapIndex;

  const categorizedEntities = useMemo<CategoryInfo[]>(() => {
    if (!entities.length) return [];

    const lowerSearchQuery = searchQuery.toLowerCase().trim();

    const entityInfoMap = new Map<string, EntityItemInfo>();

    entities.forEach((entity) => {
      if (lowerSearchQuery) {
        const entityIdKey = entity.entityDataIdKey.toLowerCase();
        const translatedEntityName = t(`entity_info:${entity.entityDataIdKey}`, {
          defaultValue: entity.entityInfo.point,
        }).toLowerCase();
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

    const categoryMap = new Map<Category, EntityItemInfo[]>();
    entityInfoMap.forEach((entity) => {
      const category = entity.category as Category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(entity);
    });

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

    const hardCordOrder = ['other', 'trchest', 'plant', 'mineral', 'system', 'enemy', 'dnarrative', 'narrative'];
    result.sort((a, b) => hardCordOrder.indexOf(a.category) - hardCordOrder.indexOf(b.category));
    return result;
  }, [entities, searchQuery, t]);

  const handleCategoryClick = (category: Category, allDisplayed: boolean) => {
    if (allDisplayed) {
      adapter.entityController.hideCategoryEntities(category);
    } else {
      adapter.entityController.showCategoryEntities(category);
    }
  };

  if (!currentMap) {
    return <div className="p-4 text-white/50 text-center">初始化中...</div>;
  }

  return (
    <div className="space-y-2 px-2">
      {/* Search */}
      <div className="pb-2">
        <Search
          value={searchQuery}
          onValueChange={(v) => setSearchQuery(v)}
          placeholder={t('sidebar:filter.search_placeholder')}
        />
      </div>

      {/* Categories */}
      {categorizedEntities.map((categoryInfo) => (
        <EntityGroup
          key={categoryInfo.category}
          title={t(`filter.category.${categoryInfo.category}`)}
          subtitle={categoryInfo.category}
          onIconClick={() => handleCategoryClick(categoryInfo.category, categoryInfo.allDisplayed)}
          iconColor={categoryInfo.allDisplayed ? '#007AFF' : '#8E8E93'}
        >
          <div className="grid grid-cols-2 gap-2">
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
