import { logger } from '@endfieldmap/tools/logger';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadData } from './data';

describe('downloadData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses the File System Access API when available', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write,
        close,
      }),
    });

    vi.stubGlobal('window', {
      showSaveFilePicker,
    });

    await downloadData({ hello: 'world' }, 'test.json');

    expect(showSaveFilePicker).toHaveBeenCalledWith({
      suggestedName: 'test.json',
      types: [
        {
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });
    expect(write).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('returns quietly when the user aborts the file picker', async () => {
    const showSaveFilePicker = vi.fn().mockRejectedValue(Object.assign(new Error('cancelled'), { name: 'AbortError' }));
    const warn = vi.spyOn(logger, 'warn');

    vi.stubGlobal('window', {
      showSaveFilePicker,
    });

    await expect(downloadData({ hello: 'world' }, 'test.json')).resolves.toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('falls back to an anchor download when the picker is unavailable or fails', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => logger);
    const click = vi.fn();
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const createElement = vi.fn().mockReturnValue({
      click,
      href: '',
      download: '',
    });
    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('window', {
      showSaveFilePicker: vi.fn().mockRejectedValue(new Error('picker failed')),
    });
    vi.stubGlobal('document', {
      createElement,
      body: {
        appendChild,
        removeChild,
      },
    });
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    await downloadData({ hello: 'world' }, 'fallback.json');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(createElement).toHaveBeenCalledWith('a');
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
