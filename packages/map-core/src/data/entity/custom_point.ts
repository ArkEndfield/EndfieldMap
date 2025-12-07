import { CustomPointKey } from '@endfieldmap/map-core/const/map';
import type { CustomPointIdKey, EntityInfoData } from '@endfieldmap/map-core/types';

/**
 * TODO: 自定义标点类型配置
 * 可以通过修改这个列表来添加新的自定义标点类型
 */
export const customPointTypeMap = {
  custom_point_1: 'icon_map_custom_mark_shadow_1',
  custom_point_2: 'icon_map_custom_mark_shadow_2',
  custom_point_3: 'icon_map_custom_mark_shadow_3',
  custom_point_4: 'icon_map_custom_mark_shadow_4',
  custom_point_5: 'icon_map_custom_mark_shadow_5',
  custom_point_6: 'icon_map_custom_mark_shadow_6',
  custom_point_7: 'icon_map_custom_mark_shadow_7',
} as const;

export const customPointTypes: EntityInfoData<CustomPointIdKey>[] = Object.entries(customPointTypeMap).map(
  ([key, value]) => ({
    category: CustomPointKey,
    entityInfo: {
      point: key as CustomPointIdKey,
      pic: value,
    },
  })
);

/**
 * 根据 entityDataIdKey 获取自定义标点的 EntityInfo
 */
export function getCustomPointEntityInfo(entityDataIdKey: string): EntityInfoData<CustomPointIdKey> | undefined {
  return customPointTypes.find((type) => type.entityInfo.point === entityDataIdKey);
}

/**
 * 获取默认的自定义标点类型
 */
export function getDefaultCustomPointType(): EntityInfoData<CustomPointIdKey> {
  return customPointTypes[0];
}
