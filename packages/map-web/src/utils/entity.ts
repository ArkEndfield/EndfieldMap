import { CustomPointKey, ElectricPoleKey } from '@endfieldmap/map-core';

import { service } from '@/services';

const assetPath = service.assetService.url;

/**
 * 获取实体图标图片
 * @param category 分类
 * @param pic 图片名称
 * @returns
 */
export const getEntityIcon = (category?: string, pic?: string) => {
  if (!category || !pic) return '';

  if (category === CustomPointKey) return `${assetPath.entityImage}/${pic}.png`;
  if (category === ElectricPoleKey) return `${assetPath.entityImage}/${pic}.png`;

  return `${assetPath.entityImage}/${pic}.png`;
};
