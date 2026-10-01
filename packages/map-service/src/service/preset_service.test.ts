import { describe, expect, it, vi } from 'vitest';

import { PresetService } from './preset_service';

describe('PresetService', () => {
  it('builds query params for electric pole presets', async () => {
    const apiGet = vi.fn().mockResolvedValue({ shares: [], total: 0 });
    const service = new PresetService({
      serverService: {
        apiGet,
      } as never,
    });

    await service.getElectricPolePresets(2, 8, 'zipline', {
      keyword: 'tower',
      sortBy: 'like_count',
      sortOrder: 'desc',
    });

    const [path, params] = apiGet.mock.calls[0] as [string, URLSearchParams];
    expect(path).toBe('/share/presets/electric-pole');
    // V2：分页参数为 size；name/sort 暂不支持（不再转发）
    expect(params.toString()).toBe('page=2&size=8&sub_type=zipline');
  });

  it('builds query params for custom point presets', async () => {
    const apiGet = vi.fn().mockResolvedValue({ shares: [], total: 0 });
    const service = new PresetService({
      serverService: {
        apiGet,
      } as never,
    });

    await service.getCustomPointPresets(3, 5, {
      keyword: 'ore',
      sortBy: 'created_at',
      sortOrder: 'asc',
    });

    const [path, params] = apiGet.mock.calls[0] as [string, URLSearchParams];
    expect(path).toBe('/share/presets/custom-point');
    expect(params.toString()).toBe('page=3&size=5');
  });

  it('parses snapshot payloads when fetching preset details or import data', async () => {
    // V2：snapshot 为解析好的 JSON 值
    const payload = {
      id: 1,
      share_code: 'abc',
      preset_type: 'electric_pole',
      name: 'n',
      is_public: true,
      import_count: 0,
      like_count: 0,
      view_count: 0,
      user_id: 1,
      snapshot: [{ id: 100 }],
    };
    const apiGet = vi.fn().mockResolvedValue(payload);
    const apiPost = vi.fn().mockResolvedValue(payload);
    const service = new PresetService({
      serverService: {
        apiGet,
        apiPost,
      } as never,
    });

    await expect(service.getPresetDetail(1)).resolves.toMatchObject({
      id: 1,
      snapshot: [{ id: 100 }],
    });
    await expect(service.getPresetDetailByCode('abc')).resolves.toMatchObject({
      id: 1,
      snapshot: [{ id: 100 }],
    });
    await expect(service.getPresetImportData(1)).resolves.toMatchObject({
      id: 1,
      snapshot: [{ id: 100 }],
    });

    expect(apiGet).toHaveBeenNthCalledWith(1, '/share/presets/1');
    expect(apiGet).toHaveBeenNthCalledWith(2, '/share/presets/code/abc');
    expect(apiPost).toHaveBeenCalledWith('/share/presets/1/import');
  });

  it('routes share, like, unlike, update, and mine requests correctly', async () => {
    const apiPost = vi.fn().mockResolvedValue({});
    const apiPut = vi.fn().mockResolvedValue({});
    const apiDelete = vi.fn().mockResolvedValue({});
    const apiGet = vi.fn().mockResolvedValue({ shares: [], total: 0 });
    const service = new PresetService({
      serverService: {
        apiPost,
        apiPut,
        apiDelete,
        apiGet,
      } as never,
    });

    const snapshot = [{ id: 1, value: 'x' }];

    await service.shareElectricPolePreset('Pole', 'Desc', 'pole', snapshot as never);
    await service.shareCustomPointPreset('Point', 'Desc', snapshot as never);
    await service.updateSharePreset(9, { name: 'Updated', is_public: false });
    await service.deleteSharePreset(9);
    await service.likePreset(7);
    await service.unlikePreset(7);
    await service.getMineSharePresets(2, 4, 'custom_point');
    await service.getMineLikedPresets(3, 6, 'electric_pole');

    expect(apiPost).toHaveBeenNthCalledWith(1, '/share/presets', {
      preset_type: 'electric_pole',
      name: 'Pole',
      description: 'Desc',
      is_public: true,
      sub_type: 'pole',
      snapshot, // V2：snapshot 直接传 JSON 值
    });
    expect(apiPost).toHaveBeenNthCalledWith(2, '/share/presets', {
      preset_type: 'custom_point',
      sub_type: '',
      name: 'Point',
      description: 'Desc',
      is_public: true,
      snapshot,
    });
    expect(apiPut).toHaveBeenCalledWith('/share/presets/9', { name: 'Updated', is_public: false });
    expect(apiDelete).toHaveBeenNthCalledWith(1, '/share/presets/9');
    expect(apiPost).toHaveBeenNthCalledWith(3, '/share/presets/7/like');
    expect(apiDelete).toHaveBeenNthCalledWith(2, '/share/presets/7/like');

    const [minePath, mineParams] = apiGet.mock.calls[0] as [string, URLSearchParams];
    const [likedPath, likedParams] = apiGet.mock.calls[1] as [string, URLSearchParams];
    expect(minePath).toBe('/share/presets/mine');
    expect(mineParams.toString()).toBe('page=2&size=4');
    expect(likedPath).toBe('/share/presets/liked');
    expect(likedParams.toString()).toBe('page=3&size=6');
  });
});
