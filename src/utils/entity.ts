import { assetsHost } from '@/services/env';
import { getAssetUrls } from './url';

/**
 * 获取实体图标图片
 * @param category 分类
 * @param pic 图片名称
 * @returns
 */
export const getEntityIcon = (category?: string, pic?: string) => {
  if (!category || !pic) return '';

  const assetPath = getAssetUrls(assetsHost);

  if (category === '#electric_pole') return `${assetPath.entityImage}/custom/${pic}.png`;

  return `${assetPath.entityImage}/${category}/${pic}.png`;
};
