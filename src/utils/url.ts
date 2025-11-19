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
export const getAssetUrls = (host?: string) => {
  return {
    mapImage: createFullUrl(host, '/images/map'),
    areaName: createFullUrl(host, '/data/map/area_name'),
    entityData: createFullUrl(host, '/data/entity'),
    entityImage: createFullUrl(host, '/images/entity'),
  };
};
