import { assetsHost } from '@/services/env';
import { getAssetUrls } from './url';
import { CustomPointKey, ElectricPoleIdKey } from '@endfieldmap/map-core';

/**
 * 获取实体图标图片
 * @param category 分类
 * @param pic 图片名称
 * @returns
 */
export const getEntityIcon = (category?: string, pic?: string) => {
  if (!category || !pic) return '';

  const assetPath = getAssetUrls(assetsHost);

  if (category === CustomPointKey || category === ElectricPoleIdKey)
    return `${assetPath.entityImage}/custom/${pic}.png`;

  return `${assetPath.entityImage}/${category}/${pic}.png`;
};
