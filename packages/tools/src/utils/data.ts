import { logger } from '@endfieldmap/tools/logger';

/**
 * 通用数据下载方法
 * @param data 要下载的数据对象
 * @param filename 文件名
 * @param type 文件MIME类型，默认为 application/json
 */
export const downloadData = async (data: unknown, filename: string, type: string = 'application/json') => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type });

  // 尝试使用 File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'JSON Files',
            accept: { [type]: ['.json'] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      // 如果用户取消了保存，直接返回，不再执行后续降级逻辑
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      logger.warn('[downloadData] File System Access API failed, falling back to <a> tag download', error);
    }
  }

  // 降级方案：使用 a 标签下载
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
