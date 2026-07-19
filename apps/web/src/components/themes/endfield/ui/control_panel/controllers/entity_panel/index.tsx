import type { Category, EntityInfoStats } from '@endfieldmap/map-core';
import { useTranslation } from 'react-i18next';
import { debounce } from '@endfieldmap/tools';
import EntityGroup from '@themes/endfield/ui/control_panel/controllers/entity_panel/group';
import EntityItem from '@themes/endfield/ui/control_panel/controllers/entity_panel/item';
import { Search } from '@themes/endfield/ui/control_panel/controllers/entity_panel/search';
import { observer } from 'mobx-react-lite';
import { Reorder, useDragControls } from 'motion/react';
import { type ReactNode, useMemo, useState } from 'react';

import { AreaFilter } from '@/components/themes/endfield/ui/control_panel/controllers/entity_panel/area_filter';
import CustomPointList from '@/components/themes/endfield/ui/control_panel/controllers/entity_panel/custom_point';
import ElectricPoleList from '@/components/themes/endfield/ui/control_panel/controllers/entity_panel/electric_pole';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';
import { applyDisplayedOrder, categoryOrderStorage, DEFAULT_CATEGORY_ORDER } from '@/services/category_order';
import { contextMenuManager } from '@/services/context_menu_manager';

interface CategoryInfo {
  category: Category;
  entities: EntityInfoStats[];
  totalEntities: number;
  displayedEntities: number;
  allDisplayed: boolean;
}

/** Reorder 包装：把手按下才开始拖拽（dragListener 关闭，避免与点击/滚动冲突） */
const CategoryReorderItem = ({
  value,
  children,
}: {
  value: string;
  children: (startDrag: (e: React.PointerEvent<HTMLDivElement>) => void) => ReactNode;
}) => {
  const controls = useDragControls();
  return (
    <Reorder.Item as="div" value={value} dragListener={false} dragControls={controls}>
      {children((e) => controls.start(e))}
    </Reorder.Item>
  );
};

/**
 * 实体面板组件
 * 显示当前地图的所有实体，支持按分类显示/隐藏
 */
const EntityPanel = observer(() => {
  const { t } = useTranslation(['sidebar', 'lang']);
  const { adapter } = useAdapter();
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSetSearchQuery = useMemo(() => {
    return debounce((value: string) => {
      setSearchQuery(value);
    }, 300);
  }, []);

  // 获取实体控制器相关方法，如果 adapter 为 null 则提供空函数
  const entities = adapter.entityController.currentStats;
  const currentMap = adapter.mapController.dataManager.currentMapId;
  // 大分类本地自定义顺序（observable，render 期读取以建立依赖）
  const customCategoryOrder = categoryOrderStorage.value;

  // 计算每个实体的 marked 数量并按分类分组
  const categorizedEntities = useMemo(() => {
    if (!entities.length) return [];

    const lowerSearchQuery = searchQuery.toLowerCase().trim();

    // 构建实体信息映射
    const entityInfoMap = new Map<string, EntityInfoStats>();

    entities.forEach((entity) => {
      // 如果有搜索条件，进行过滤
      if (lowerSearchQuery) {
        const entityIdKey = entity.entityDataIdKey.toLowerCase();
        const translatedEntityName = t(`lang:${service.langHashService.getHash(entity.entityDataIdKey)}`, {
          defaultValue: entity.entityInfo.point,
        }).toLowerCase();
        const category = entity.category.toLowerCase();
        const translatedCategory = t(`sidebar:filter.category.${entity.category}`, {
          defaultValue: entity.category.toLowerCase(),
        }).toLowerCase();

        const matches =
          entityIdKey.includes(lowerSearchQuery) ||
          translatedEntityName.includes(lowerSearchQuery) ||
          translatedCategory.includes(lowerSearchQuery) ||
          category.includes(lowerSearchQuery);

        if (!matches) return;
      }

      entityInfoMap.set(entity.entityDataIdKey, entity);
    });

    // 按 category 分组
    const categoryMap = new Map<Category, EntityInfoStats[]>();
    entityInfoMap.forEach((entity) => {
      const category = entity.category as Category;
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

    // 按本地自定义顺序排序（未自定义时用默认表）；不在表内的分类排最前，彼此稳定
    const order = customCategoryOrder.length ? customCategoryOrder : DEFAULT_CATEGORY_ORDER;
    result.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
    return result;
  }, [entities, searchQuery, t, customCategoryOrder]);

  const openGroupContextMenu = (
    entityDataIdKeys: Set<string>,
    e: React.MouseEvent<HTMLButtonElement>,
    category?: Category
  ) => {
    // 与区域筛选联动：只作用于当前选中区域内的点位（无 level 维度的数据不过滤）
    const selectedLevelIds = new Set(adapter.entityController.getSelectedLevelIds(currentMap));
    const instances = adapter.entityController
      .getMapGroupManagerList(currentMap)
      .filter((groupManager) => entityDataIdKeys.has(groupManager.entityDataIdKey))
      .flatMap((groupManager) => groupManager.instances)
      .filter((instance) => !instance.data.mapLevelId || selectedLevelIds.has(instance.data.mapLevelId));
    contextMenuManager.open({
      type: 'group',
      entities: instances,
      category,
      pixel: [e.clientX, e.clientY],
      originalEvent: e.nativeEvent,
    });
  };

  // 标点条目右键菜单：entities 为该类型标点的全部点位实例
  const handleEntityContextMenu = (entityDataIdKey: string, e: React.MouseEvent<HTMLButtonElement>) => {
    openGroupContextMenu(new Set([entityDataIdKey]), e);
  };

  // 大分类组头右键菜单：entities 为该分类（经搜索过滤后）的全部点位实例，带 category 以启用上移/下移
  const handleCategoryContextMenu = (categoryInfo: CategoryInfo, e: React.MouseEvent<HTMLButtonElement>) => {
    openGroupContextMenu(new Set(categoryInfo.entities.map((entity) => entity.entityDataIdKey)), e, categoryInfo.category);
  };

  // 切换分类显示/隐藏
  const handleCategoryClick = (category: Category, allDisplayed: boolean) => {
    const isShow = !allDisplayed;
    const allEntityDataIds = categorizedEntities
      .find((c) => c.category === category)
      ?.entities.map((e) => e.entityDataIdKey);
    if (!allEntityDataIds) return;
    allEntityDataIds.forEach((entityDataId) => {
      service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(currentMap, entityDataId, isShow);
    });
  };

  if (!currentMap) {
    return <div className="p-4 text-gray-500">初始化中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 搜索输入框 */}
      <div className="px-1 pt-2">
        <Search
          value={inputValue}
          onValueChange={(v) => {
            setInputValue(v);
            debouncedSetSearchQuery(v);
          }}
          placeholder={t('sidebar:filter.search_placeholder')}
        />
      </div>

      <div>
        {!searchQuery && <AreaFilter />}
        {!searchQuery && <CustomPointList />}
        {!searchQuery && <ElectricPoleList />}
        <Reorder.Group
          as="div"
          axis="y"
          values={categorizedEntities.map((categoryInfo) => categoryInfo.category)}
          onReorder={applyDisplayedOrder}
        >
          {categorizedEntities.map((categoryInfo) => (
            <CategoryReorderItem key={categoryInfo.category} value={categoryInfo.category}>
              {(startDrag) => (
                <EntityGroup
                  title={t(`filter.category.${categoryInfo.category}`)}
                  subtitle={categoryInfo.category}
                  onIconClick={() => handleCategoryClick(categoryInfo.category, categoryInfo.allDisplayed)}
                  onHeaderContextMenu={(e) => handleCategoryContextMenu(categoryInfo, e)}
                  onDragHandlePointerDown={startDrag}
                  iconColor={categoryInfo.allDisplayed ? '#f9f853' : '#ffffff'}
                  totalCount={categoryInfo.entities.reduce((acc, entity) => acc + entity.count, 0)}
                  markedCount={categoryInfo.entities.reduce((acc, entity) => acc + (entity.markedCount ?? 0), 0)}
                >
                  {/* {categoryInfo.displayedEntities}/{categoryInfo.totalEntities} */}
                  {/* 实体列表 */}
                  <div className="grid grid-cols-2 gap-x-1 gap-y-1.5 py-2">
                    {categoryInfo.entities.map((entity) => (
                      <EntityItem
                        key={entity.entityDataIdKey}
                        entity={entity}
                        category={categoryInfo.category}
                        active={entity.visible}
                        onClick={() =>
                          service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(
                            currentMap,
                            entity.entityDataIdKey,
                            !entity.visible
                          )
                        }
                        onContextMenu={(e) => handleEntityContextMenu(entity.entityDataIdKey, e)}
                        hideCount={false}
                      />
                    ))}
                  </div>
                </EntityGroup>
              )}
            </CategoryReorderItem>
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
});

export default EntityPanel;
