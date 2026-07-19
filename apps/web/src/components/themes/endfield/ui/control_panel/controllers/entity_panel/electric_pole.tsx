import type { ElectricPoleDataInstance, ElectricPoleDeviceKey } from '@endfieldmap/map-core';
import {
  ELECTRIC_POLE_DEVICE_CONFIGS,
  ElectricPoleIdKey,
  ElectricPoleKey,
  getElectricPoleDeviceConfig,
  isElectricPoleDeviceAvailableOnMap,
} from '@endfieldmap/map-core';
import EntityGroup from '@themes/endfield/ui/control_panel/controllers/entity_panel/group';
import EntityItem from '@themes/endfield/ui/control_panel/controllers/entity_panel/item';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

interface ElectricPoleTypeGroup {
  deviceKey: ElectricPoleDeviceKey;
  instances: ElectricPoleDataInstance[];
  allVisible: boolean;
  count: number;
  visibleCount: number;
}

const ElectricPoleList: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const { adapter } = useAdapter();

  const instances = adapter.electricPoleController.dataManager.currentInstances;

  const { groups, totalCount } = (() => {
    const groupMap = new Map<ElectricPoleDeviceKey, ElectricPoleDataInstance[]>();
    let total = 0;

    // Group existing instances
    if (instances.length > 0) {
      instances.forEach((instance) => {
        const key = instance.deviceKey;
        if (!groupMap.has(key)) {
          groupMap.set(key, []);
        }
        groupMap.get(key)!.push(instance);
        total++;
      });
    }

    const result: ElectricPoleTypeGroup[] = [];
    const allDeviceKeys = Object.keys(ELECTRIC_POLE_DEVICE_CONFIGS) as ElectricPoleDeviceKey[];

    allDeviceKeys.forEach((deviceKey) => {
      const groupInstances = groupMap.get(deviceKey) || [];
      const count = groupInstances.length;

      // 当前地图不可用的设备类型（如暗管仅 map02）：无数据时不展示分组，有历史数据仍展示便于管理
      if (count === 0 && !isElectricPoleDeviceAvailableOnMap(deviceKey, adapter.mapController.dataManager.currentMapId)) {
        return;
      }

      // 直接从 Controller 获取可见性状态（Source of Truth）
      const allVisible = adapter.electricPoleController.getDeviceVisible(deviceKey);

      // visibleCount 仅用于统计显示
      let visibleCount = 0;
      if (count > 0) {
        visibleCount = groupInstances.filter((i) => i.visible).length;
      }

      result.push({
        deviceKey,
        instances: groupInstances,
        allVisible,
        count,
        visibleCount,
      });
    });

    return { groups: result, totalCount: total };
  })();

  const allDisplayed = groups.every((g) => g.allVisible);

  const handleToggleTypeVisible = (group: ElectricPoleTypeGroup) => {
    const newVisible = !group.allVisible;
    service.dataService.mapDataService.electricPoleDataService.updateItemVisibility(
      adapter.mapController.dataManager.currentMapId,
      group.deviceKey,
      newVisible
    );
  };

  const handleToggleAll = () => {
    const newVisible = !allDisplayed;
    groups.forEach((group) => {
      service.dataService.mapDataService.electricPoleDataService.updateItemVisibility(
        adapter.mapController.dataManager.currentMapId,
        group.deviceKey,
        newVisible
      );
    });
  };

  return (
    <EntityGroup
      title={t('filter.category.#electric_pole')}
      subtitle="ELECTRIC POLE"
      defaultOpen={false}
      totalCount={totalCount}
      onIconClick={handleToggleAll}
      iconColor={allDisplayed ? '#f9f853' : '#ffffff'}
    >
      <div className="grid grid-cols-2 gap-x-1 gap-y-1.5 py-2">
        {groups.map((group) => {
          const { iconPic } = getElectricPoleDeviceConfig(group.deviceKey);
          const entityInfo = {
            uniqueKey: group.deviceKey,
            category: ElectricPoleKey,
            entityDataIdKey: group.deviceKey,
            entityInfo: {
              pic: iconPic,
              point: ElectricPoleIdKey,
            },
            count: group.count,
            markedCount: 0,
            visible: group.allVisible,
          } as const;

          return (
            <EntityItem
              key={group.deviceKey}
              entity={entityInfo}
              category={ElectricPoleKey}
              active={group.allVisible}
              onClick={() => handleToggleTypeVisible(group)}
              hideMarked
            />
          );
        })}
      </div>
    </EntityGroup>
  );
});

export default ElectricPoleList;
