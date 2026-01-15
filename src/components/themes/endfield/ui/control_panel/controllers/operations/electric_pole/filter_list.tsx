import type { ElectricPoleDataInstance, ElectricPoleDeviceKey } from '@endfieldmap/map-core';
import { ElectricPoleIdKey, ElectricPoleKey, getElectricPoleDeviceConfig } from '@endfieldmap/map-core';
import EntityItem from '@themes/endfield/ui/control_panel/controllers/entity_panel/item';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { ScrollArea } from '@/components/common/scroll_area';
import { useAdapter } from '@/hooks/use_adapter';

interface ElectricPoleTypeGroup {
  deviceKey: ElectricPoleDeviceKey;
  instances: ElectricPoleDataInstance[];
  allVisible: boolean;
  count: number;
  visibleCount: number;
}

const ElectricPoleList: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const { adapter, dataService } = useAdapter();

  const instances = adapter.electricPoleController.dataManager.currentInstances;

  const groups: ElectricPoleTypeGroup[] = (() => {
    if (instances.length === 0) return [];

    const groupMap = new Map<ElectricPoleDeviceKey, ElectricPoleDataInstance[]>();
    instances.forEach((instance) => {
      const key = instance.deviceKey;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(instance);
    });

    const result: ElectricPoleTypeGroup[] = [];
    groupMap.forEach((groupInstances, deviceKey) => {
      const visibleCount = groupInstances.filter((i) => i.visible).length;
      result.push({
        deviceKey,
        instances: groupInstances,
        allVisible: visibleCount === groupInstances.length,
        count: groupInstances.length,
        visibleCount,
      });
    });
    return result;
  })();

  const handleToggleTypeVisible = (group: ElectricPoleTypeGroup) => {
    const newVisible = !group.allVisible;
    group.instances.forEach((instance) => instance.setVisible(newVisible));
    dataService.electricPoleDataService.updateDeviceVisibility(adapter.currentMapIndex, group.deviceKey, newVisible);
  };

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#888888] text-sm">
        {t('operation.electric_pole.no_data')}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" contentClassName="grid grid-cols-2 gap-2 py-2 px-3 items-start content-start">
      {groups.map((group) => {
        const { iconPic } = getElectricPoleDeviceConfig(group.deviceKey);
        const entityInfo = {
          category: ElectricPoleKey,
          entityDataIdKey: group.deviceKey,
          entityInfo: {
            pic: iconPic,
            point: ElectricPoleIdKey,
          },
          count: group.count,
          markedCount: 0,
          visible: group.allVisible,
        };

        return (
          <EntityItem
            key={group.deviceKey}
            entity={entityInfo}
            category={ElectricPoleKey}
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

export default ElectricPoleList;
