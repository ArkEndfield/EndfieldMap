import type { CustomPointDataInstance, CustomPointTypeId } from '@endfieldmap/map-core';
import {
  CustomPointKey,
  customPointTypes,
  getCustomPointEntityInfo,
  isValidCustomPointType,
} from '@endfieldmap/map-core';
import EntityGroup from '@themes/endfield/ui/control_panel/controllers/entity_panel/group';
import EntityItem from '@themes/endfield/ui/control_panel/controllers/entity_panel/item';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';

interface CustomPointTypeGroup {
  entityDataIdKey: string;
  instances: CustomPointDataInstance[];
  allVisible: boolean;
  count: number;
  visibleCount: number;
}

/**
 * 自定义标点列表组件
 * 按类型分组显示自定义标点，支持按类型显示/隐藏切换
 */
const CustomPointList: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const { adapter, dataService } = useAdapter();

  // 从 DataManager 获取当前地图的所有自定义标点实例
  const dataManager = adapter.customPointController.dataManager;
  const currentManager = dataManager.currentManager;
  const instances = currentManager?.instances ?? [];
  const currentMapIndex = adapter.currentMapIndex;

  // 按类型分组
  const { customPointGroups, totalCount } = (() => {
    const groupMap = new Map<string, CustomPointDataInstance[]>();
    let total = 0;

    // Group existing instances
    if (instances.length > 0) {
      instances.forEach((instance) => {
        const key = instance.typeId;
        if (!groupMap.has(key)) {
          groupMap.set(key, []);
        }
        groupMap.get(key)!.push(instance);
        total++;
      });
    }

    // 转换为数组并计算统计信息
    const groups: CustomPointTypeGroup[] = [];

    customPointTypes.forEach((typeConfig) => {
      const entityDataIdKey = typeConfig.id;
      const groupInstances = groupMap.get(entityDataIdKey) || [];
      const count = groupInstances.length;
      let allVisible = true;
      let visibleCount = 0;

      if (count > 0) {
        visibleCount = groupInstances.filter((i) => i.visible).length;
        allVisible = visibleCount === count;
      } else {
        // If no instances, use stored visibility preference
        const storedVisibility =
          dataService.customPointDataService.customPointVisibilityData[currentMapIndex]?.[entityDataIdKey];
        // Default to true if not set
        allVisible = storedVisibility !== false;
      }

      groups.push({
        entityDataIdKey,
        instances: groupInstances,
        allVisible,
        count,
        visibleCount,
      });
    });

    return { customPointGroups: groups, totalCount: total };
  })();

  const allDisplayed = customPointGroups.every((g) => g.allVisible);

  // 切换某个类型的所有自定义标点的显示/隐藏
  const handleToggleTypeVisible = (group: CustomPointTypeGroup) => {
    const newVisible = !group.allVisible;
    if (group.instances.length > 0) {
      group.instances.forEach((instance) => {
        instance.setVisible(newVisible);
      });
    }
    // 保存可见性状态
    dataService.customPointDataService.updateCustomPointVisibility(
      adapter.currentMapIndex,
      group.entityDataIdKey,
      newVisible
    );
  };

  const handleToggleAll = () => {
    const newVisible = !allDisplayed;
    customPointGroups.forEach((group) => {
      if (group.instances.length > 0) {
        group.instances.forEach((instance) => instance.setVisible(newVisible));
      }
      dataService.customPointDataService.updateCustomPointVisibility(
        adapter.currentMapIndex,
        group.entityDataIdKey,
        newVisible
      );
    });
  };

  return (
    <EntityGroup
      title={t('filter.category.#custom_point')}
      subtitle="CUSTOM POINT"
      totalCount={totalCount}
      onIconClick={handleToggleAll}
      iconColor={allDisplayed ? '#f9f853' : '#ffffff'}
    >
      <div className="grid grid-cols-2 gap-x-1 gap-y-1.5 py-2">
        {customPointGroups.map((group) => {
          // 获取该类型的完整 EntityInfo（包含正确的 pic）
          const typeEntityInfo = isValidCustomPointType(group.entityDataIdKey)
            ? getCustomPointEntityInfo(group.entityDataIdKey as CustomPointTypeId)
            : getCustomPointEntityInfo('custom_point_1');

          // 构造 EntityItem 需要的数据
          const entityInfo = {
            uniqueKey: group.entityDataIdKey,
            category: CustomPointKey,
            entityDataIdKey: group.entityDataIdKey,
            entityInfo: typeEntityInfo.entityInfo,
            count: group.count,
            markedCount: 0,
            visible: group.allVisible,
          } as const;

          return (
            <EntityItem
              key={group.entityDataIdKey}
              entity={entityInfo}
              category={CustomPointKey}
              active={group.allVisible}
              onClick={() => handleToggleTypeVisible(group)}
              hideCount
              hideMarked
            />
          );
        })}
      </div>
    </EntityGroup>
  );
});

export default CustomPointList;
