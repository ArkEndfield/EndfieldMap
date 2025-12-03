import { CustomPointKey, ElectricPoleKey } from '@endfieldmap/map-core';

import { getAssetUrls } from '@/utils/url';

/**
 * 获取实体图标图片
 * @param category 分类
 * @param pic 图片名称
 * @returns
 */
export const getEntityIcon = (category?: string, pic?: string) => {
  if (!category || !pic) return '';

  const assetPath = getAssetUrls();

  if (category === CustomPointKey || category === ElectricPoleKey) return `${assetPath.entityImage}/custom/${pic}.png`;

  return `${assetPath.entityImage}/${category}/${pic}.png`;
};
