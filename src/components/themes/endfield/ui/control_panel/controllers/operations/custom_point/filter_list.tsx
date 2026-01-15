import type { CustomPointDataInstance, CustomPointTypeId } from '@endfieldmap/map-core';
import { CustomPointKey, getCustomPointEntityInfo, isValidCustomPointType } from '@endfieldmap/map-core';
import EntityItem from '@themes/endfield/ui/control_panel/controllers/entity_panel/item';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { ScrollArea } from '@/components/common/scroll_area';
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

  // 按类型分组
  const customPointGroups: CustomPointTypeGroup[] = (() => {
    if (instances.length === 0) return [];

    // 按 entityDataIdKey 分组
    const groupMap = new Map<string, CustomPointDataInstance[]>();
    instances.forEach((instance) => {
      const key = instance.typeId;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(instance);
    });

    // 转换为数组并计算统计信息
    const groups: CustomPointTypeGroup[] = [];
    groupMap.forEach((groupInstances, entityDataIdKey) => {
      // 访问 instance.visible 会被 MobX observer 追踪
      const visibleCount = groupInstances.filter((i) => i.visible).length;
      groups.push({
        entityDataIdKey,
        instances: groupInstances,
        allVisible: visibleCount === groupInstances.length,
        count: groupInstances.length,
        visibleCount,
      });
    });

    return groups;
  })();

  // 切换某个类型的所有自定义标点的显示/隐藏
  const handleToggleTypeVisible = (group: CustomPointTypeGroup) => {
    const newVisible = !group.allVisible;
    group.instances.forEach((instance) => {
      instance.setVisible(newVisible);
    });
    // 保存可见性状态
    dataService.customPointDataService.updateCustomPointVisibility(
      adapter.currentMapIndex,
      group.entityDataIdKey,
      newVisible
    );
  };

  if (customPointGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#888888] text-sm">
        {t('operation.custom_point.no_data')}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" contentClassName="grid grid-cols-2 gap-2 py-2 px-3 items-start content-start">
      {customPointGroups.map((group) => {
        // 获取该类型的完整 EntityInfo（包含正确的 pic）
        const typeEntityInfo = isValidCustomPointType(group.entityDataIdKey)
          ? getCustomPointEntityInfo(group.entityDataIdKey as CustomPointTypeId)
          : getCustomPointEntityInfo('custom_point_1');

        // 构造 EntityItem 需要的数据
        const entityInfo = {
          category: CustomPointKey,
          entityDataIdKey: group.entityDataIdKey,
          entityInfo: typeEntityInfo.entityInfo,
          count: group.count,
          markedCount: 0, // 自定义标点不支持标记
          visible: group.allVisible,
        };

        return (
          <EntityItem
            key={group.entityDataIdKey}
            entity={entityInfo}
            category={CustomPointKey}
            active={group.allVisible}
            onClick={() => handleToggleTypeVisible(group)}
            hideCount={false}
            hideMarked
          />
        );
      })}
    </ScrollArea>
  );
});

export default CustomPointList;
