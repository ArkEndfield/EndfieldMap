import { CustomPointKey } from '@endfieldmap/map-core/const/map';
import type { CustomPointTypeConfig, CustomPointTypeId, EntityInfoData } from '@endfieldmap/map-core/types/entity';

/**
 * 自定义标点类型映射
 */
export const customPointTypeMap: Record<CustomPointTypeId, string> = {
  custom_point_1: 'icon_map_custom_mark_shadow_1',
  custom_point_2: 'icon_map_custom_mark_shadow_2',
  custom_point_3: 'icon_map_custom_mark_shadow_3',
  custom_point_4: 'icon_map_custom_mark_shadow_4',
  custom_point_5: 'icon_map_custom_mark_shadow_5',
  custom_point_6: 'icon_map_custom_mark_shadow_6',
  custom_point_7: 'icon_map_custom_mark_shadow_7',
};

/**
 * 自定义标点类型配置列表
 */
export const customPointTypes: CustomPointTypeConfig[] = Object.entries(customPointTypeMap).map(([id, icon]) => ({
  id: id as CustomPointTypeId,
  icon,
}));

/**
 * 获取自定义标点的EntityInfo
 */
export function getCustomPointEntityInfo(typeId: CustomPointTypeId): EntityInfoData {
  const icon = customPointTypeMap[typeId];
  return {
    category: CustomPointKey,
    entityInfo: {
      point: typeId,
      pic: icon,
    },
  };
}

/**
 * 获取默认的自定义标点类型
 */
export function getDefaultCustomPointType(): CustomPointTypeConfig {
  return customPointTypes[0];
}

/**
 * 获取默认的自定义标点EntityInfo
 */
export function getDefaultCustomPointEntityInfo(): EntityInfoData {
  const defaultType = getDefaultCustomPointType();
  return getCustomPointEntityInfo(defaultType.id);
}

/**
 * 检查是否是有效的自定义标点类型
 */
export function isValidCustomPointType(typeId: string): typeId is CustomPointTypeId {
  return typeId in customPointTypeMap;
}
