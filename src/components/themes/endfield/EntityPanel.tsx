import type { EntityInfoItemData } from '@endfieldmap/map-core/types/entity';
import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import type { EntityPanelProps } from '@/components/themes/types/entity_panel';

interface EntityItemInfo extends EntityInfoItemData {
  markedCount: number;
}

interface CategoryInfo {
  category: string;
  entities: EntityItemInfo[];
  totalEntities: number;
  displayedEntities: number;
  allDisplayed: boolean;
}

/**
 * 实体面板组件
 * 显示当前地图的所有实体，支持按分类显示/隐藏
 */
const EntityPanel = observer(({ adapter }: EntityPanelProps) => {
  // 获取实体控制器相关方法，如果 adapter 为 null 则提供空函数
  const entities = adapter.entityController.currentEntityInfoList;
  const currentMap = adapter.currentMapIndex;

  // 计算每个实体的 marked 数量并按分类分组
  const categorizedEntities = useMemo<CategoryInfo[]>(() => {
    if (!entities.length) return [];

    // 构建实体信息映射
    const entityInfoMap = new Map<string, EntityItemInfo>();

    entities.forEach((entity) => {
      entityInfoMap.set(entity.entityDataIdKey, entity);
    });

    // 按 category 分组
    const categoryMap = new Map<string, EntityItemInfo[]>();
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
  }, [entities]);

  // 切换分类显示/隐藏
  const handleCategoryClick = (category: string, allDisplayed: boolean) => {
    if (allDisplayed) {
      adapter.entityController.hideCategoryEntities(category);
    } else {
      adapter.entityController.showCategoryEntities(category);
    }
  };

  if (!currentMap) {
    return <div className="p-4 text-gray-500">初始化中...</div>;
  }

  if (!categorizedEntities.length) {
    return <div className="p-4 text-gray-500">加载中...</div>;
  }

  return (
    <div className="w-64 h-full overflow-auto bg-white absolute bottom-0 left-0 right-0">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 sticky top-0 bg-white z-10 pb-2 border-b">实体列表</h2>

        {categorizedEntities.map((categoryInfo) => (
          <div key={categoryInfo.category} className="space-y-2">
            {/* 分类标题 */}
            <button
              onClick={() => handleCategoryClick(categoryInfo.category, categoryInfo.allDisplayed)}
              className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                categoryInfo.allDisplayed
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{categoryInfo.category}</span>
                <span className="ml-2 text-xs font-normal whitespace-nowrap">
                  {categoryInfo.displayedEntities}/{categoryInfo.totalEntities}
                </span>
              </div>
            </button>

            {/* 实体列表 */}
            <div className="space-y-1 pl-2">
              {categoryInfo.entities.map((entity) => (
                <button
                  key={entity.entityDataIdKey}
                  onClick={() => adapter?.entityController.toggleEntityVisible(entity.entityDataIdKey)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    entity.visible
                      ? 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate flex-1">{entity.entityInfo.pic}</span>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          entity.markedCount === entity.count
                            ? 'bg-blue-100 text-blue-700'
                            : entity.markedCount > 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {entity.markedCount}/{entity.count}
                      </span>
                      <span className={`text-xs font-medium ${entity.visible ? 'text-green-600' : 'text-gray-400'}`}>
                        {entity.visible ? '显示' : '隐藏'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default EntityPanel;
