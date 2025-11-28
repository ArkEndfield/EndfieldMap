import type { EntityInfoData } from '@endfieldmap/map-core/types';
import { CustomPointKey } from '@endfieldmap/map-core/const/map';

/**
 * TODO: 自定义标点类型配置
 * 可以通过修改这个列表来添加新的自定义标点类型
 */
export const customPointTypes: EntityInfoData[] = [
  {
    category: CustomPointKey,
    entityInfo: {
      point: 'custom_point_marker',
      pic: 'marker',
    },
  },
  {
    category: CustomPointKey,
    entityInfo: {
      point: 'custom_point_flag',
      pic: 'flag',
    },
  },
  {
    category: CustomPointKey,
    entityInfo: {
      point: 'custom_point_star',
      pic: 'star',
    },
  },
  {
    category: CustomPointKey,
    entityInfo: {
      point: 'custom_point_pin',
      pic: 'pin',
    },
  },
];

/**
 * 根据 entityDataIdKey 获取自定义标点的 EntityInfo
 */
export function getCustomPointEntityInfo(entityDataIdKey: string): EntityInfoData | undefined {
  return customPointTypes.find((type) => type.entityInfo.point === entityDataIdKey);
}

/**
 * 获取默认的自定义标点类型
 */
export function getDefaultCustomPointType(): EntityInfoData {
  return customPointTypes[0];
}
