import { assetsHost, backendHost } from '@/services/env';

/**
 * 创建完整URL
 * @param host 前缀
 * @param path 路径
 * @returns 完整URL
 */
export const createFullUrl = (host: string = '', path: string) => {
  if (!host || !host.startsWith('http')) {
    return path;
  }
  return new URL(path, host).toString();
};

/**
 * 获取资源URL
 * @param host 前缀
 * @returns 资源URL
 */
export const getAssetUrls = () => {
  const host = assetsHost;
  return {
    mapImage: createFullUrl(host, '/images/map'),
    mapData: createFullUrl(host, '/data/map'),
    entityData: createFullUrl(host, '/data/entity'),
    tierData: createFullUrl(host, '/data/tier'),
    langHash: createFullUrl(host, '/data/entity'),
    entityImage: createFullUrl(host, '/images/icon'),
    itemData: createFullUrl(host, '/dev/item'),
    itemImage: createFullUrl(host, '/images/icon'),
    tierImage: createFullUrl(host, '/images/tier'),
    miniGameData: createFullUrl(host, '/data/minigame'),
    avatar: createFullUrl(host, '/images/avatar'),
    misc: createFullUrl(host, '/images/misc'),
    audio: createFullUrl(host, '/audio'),
  };
};

export const getBackendUrl = (path: string) => {
  const host = backendHost;
  return createFullUrl(host, path);
};
