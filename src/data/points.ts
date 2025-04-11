const folders = import.meta.glob('/public/data/map*/*.json');
// 获取 map(id)_lv(id) 文件夹列表，去重
const mapFoldersSet = Object.keys(folders).reduce((acc, path) => {
  const match = path.match(/\/data\/(map\d+_lv\d+)\//);
  if (match) {
    acc.add(match[1]);
  }
  return acc;
}, new Set<string>());
export const mapFolders = Array.from(mapFoldersSet);
// 由于每个文件夹下的文件名都一样，所以我们只取第一个文件夹下的所有文件名
const fileNames = Object.keys(folders).reduce((acc, path) => {
  const match = path.match(/\/data\/map\d+_lv\d+\/(.*)\.json/);
  if (match) {
    acc.push(match[1]);
  }
  return acc;
}, [] as string[]);
// 去重
export const mapFileNames = Array.from(new Set(fileNames));
