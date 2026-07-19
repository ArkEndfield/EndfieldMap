import type { DataInstance } from '@endfieldmap/map-core';
import { EntityDataInstance } from '@endfieldmap/map-core';
import { CenterIcon2, FilterMarked, FilterUnMarked } from '@endfieldmap/web-components';

import { service } from '@/services';
import { contextMenuManager } from '@/services/context_menu_manager';

/** 组内可标记、且标记状态为 marked 的实体点位（分组右键菜单只作用于普通实体） */
function getMarkableEntities(entities: DataInstance[] | undefined, marked: boolean): EntityDataInstance[] {
  return (entities ?? []).filter(
    (instance): instance is EntityDataInstance =>
      instance instanceof EntityDataInstance && instance.markable && instance.marked === marked
  );
}

const getUnmarkedEntities = (entities?: DataInstance[]) => getMarkableEntities(entities, false);

/** 按地图分组批量标记/取消标记 */
function markAllEntities(entities: EntityDataInstance[], marked: boolean) {
  const idsByMap = new Map<string, number[]>();
  entities.forEach((instance) => {
    const ids = idsByMap.get(instance.mapId) ?? [];
    ids.push(instance.id);
    idsByMap.set(instance.mapId, ids);
  });
  idsByMap.forEach((ids, mapId) => {
    service.dataService.mapDataService.entityDataService.markEntities(mapId, ids, marked);
  });
}

/**
 * 侧边栏标点分组 / 区域筛选条目的右键菜单项。
 * 触发方由 EntityPanel / AreaFilter 以 type: 'group' 打开，entities 为该组全部点位实例。
 */
export function initGroupContextMenu(): () => void {
  const disposeMarkAll = contextMenuManager.register({
    id: 'group-mark-all',
    label: 'context_menu.mark_all',
    icon: FilterMarked,
    order: 10,
    visible: (ctx) => ctx.type === 'group' && getMarkableEntities(ctx.entities, false).length > 0,
    action: (ctx) => {
      markAllEntities(getMarkableEntities(ctx.entities, false), true);
    },
  });

  const disposeUnmarkAll = contextMenuManager.register({
    id: 'group-unmark-all',
    label: 'context_menu.unmark_all',
    icon: FilterUnMarked,
    order: 15,
    visible: (ctx) => ctx.type === 'group' && getMarkableEntities(ctx.entities, true).length > 0,
    action: (ctx) => {
      markAllEntities(getMarkableEntities(ctx.entities, true), false);
    },
  });

  const disposeNearestUnmarked = contextMenuManager.register({
    id: 'group-nearest-unmarked',
    label: 'context_menu.nearest_unmarked',
    icon: CenterIcon2,
    order: 20,
    visible: (ctx) => ctx.type === 'group' && getUnmarkedEntities(ctx.entities).length > 0,
    action: (ctx) => {
      const unmarked = getUnmarkedEntities(ctx.entities);
      if (!unmarked.length) return;

      const adapter = service.adapterRegistry?.adapter;
      const center = adapter?.mapController.getCenter();
      let nearest = unmarked[0];
      if (center) {
        let minDistance = Infinity;
        for (const instance of unmarked) {
          const coord = instance.coordinates;
          if (!coord) continue;
          const distance = (coord[0] - center[0]) ** 2 + (coord[1] - center[1]) ** 2;
          if (distance < minDistance) {
            minDistance = distance;
            nearest = instance;
          }
        }
      }

      // 目标点所在区域若被区域筛选取消勾选，跳过去也看不到点位，先恢复选中
      const levelId = nearest.data.mapLevelId;
      if (adapter && levelId && !adapter.entityController.getSelectedLevelIds(nearest.mapId).includes(levelId)) {
        adapter.entityController.setLevelSelected(nearest.mapId, levelId, true);
      }
      service.dataService.mapDataService.moveToEntityInstance(nearest, true, true);
    },
  });

  return () => {
    disposeMarkAll();
    disposeUnmarkAll();
    disposeNearestUnmarked();
  };
}
