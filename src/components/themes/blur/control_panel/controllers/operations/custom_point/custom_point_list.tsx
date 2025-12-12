import { CustomPointKey } from '@endfieldmap/map-core/const/map';
import { getCustomPointEntityInfo, getDefaultCustomPointType } from '@endfieldmap/map-core/data/entity/custom_point';
import type { CustomPointFeature } from '@endfieldmap/map-core/render/source/feature/custom_point_feature';
import type { EntityInfoItemData } from '@endfieldmap/map-core/types/entity';
import EntityItem from '@themes/blur/control_panel/controllers/entity_panel/item';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { ScrollArea } from '@/components/common/scroll_area';
import { useAdapter } from '@/hooks/use_adapter';

interface CustomPointTypeGroup {
  entityDataIdKey: string;
  features: CustomPointFeature[];
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

  // 获取当前地图的所有自定义标点features，并按类型分组
  const layer = adapter.customPointController.layerContainer;
  const features = layer?.entity.features || [];
  const customPointGroups: CustomPointTypeGroup[] = (() => {
    if (features.length === 0) return [];

    // 按 entityDataIdKey 分组
    const groupMap = new Map<string, CustomPointFeature[]>();
    features.forEach((feature) => {
      const key = feature.data.entityDataIdKey;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(feature);
    });

    // 转换为数组并计算统计信息
    const groups: CustomPointTypeGroup[] = [];
    groupMap.forEach((features, entityDataIdKey) => {
      // 访问 feature.visible 会被 MobX observer 追踪
      const visibleCount = features.filter((f) => f.visible).length;
      groups.push({
        entityDataIdKey,
        features,
        allVisible: visibleCount === features.length,
        count: features.length,
        visibleCount,
      });
    });

    return groups;
  })();

  // 切换某个类型的所有自定义标点的显示/隐藏
  const handleToggleTypeVisible = (group: CustomPointTypeGroup) => {
    const newVisible = !group.allVisible;
    group.features.forEach((feature) => {
      feature.setVisible(newVisible);
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
      <div className="flex items-center justify-center h-full text-white/40 text-xs">
        {t('operation.custom_point.no_data')}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="grid grid-cols-2 gap-2 py-2 px-2">
        {customPointGroups.map((group) => {
          // 获取该类型的完整 EntityInfoData（包含正确的 pic）
          const typeEntityInfo = getCustomPointEntityInfo(group.entityDataIdKey) || getDefaultCustomPointType();

          // 构造 EntityInfoItemData 用于 EntityItem 组件
          const entityInfo: EntityInfoItemData = {
            uniqueKey: `custom-point-${group.entityDataIdKey}`,
            category: CustomPointKey,
            entityDataIdKey: group.entityDataIdKey,
            entityInfo: typeEntityInfo.entityInfo,
            visible: group.allVisible,
            data: group.features.map((f) => f.data),
            mapIndex: adapter.currentMapIndex!,
            count: group.count,
            markedCount: 0, // 自定义标点不支持标记
            selectedCount: 0,
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
      </div>
    </ScrollArea>
  );
});

export default CustomPointList;
