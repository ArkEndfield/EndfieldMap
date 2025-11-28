import type { CustomPointIdKey, EntityInfoData } from '@endfieldmap/map-core/types';
import { CustomPointKey } from '@endfieldmap/map-core/const/map';

/**
 * TODO: 自定义标点类型配置
 * 可以通过修改这个列表来添加新的自定义标点类型
 */
export const customPointTypeMap = {
  custom_point_marker: 'marker',
  custom_point_flag: 'flag',
  custom_point_star: 'star',
  custom_point_pin: 'pin',
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
