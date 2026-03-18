import { describe, expect, it, vi } from 'vitest';

import { PresetService } from './preset_service';

describe('PresetService', () => {
  it('builds query params for electric pole presets', async () => {
    const apiGet = vi.fn().mockResolvedValue({ list: [], count: 0 });
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
    expect(params.toString()).toBe('page=2&limit=8&sub_type=zipline&name=tower&sort_by=like_count&sort_order=desc');
  });

  it('builds query params for custom point presets', async () => {
    const apiGet = vi.fn().mockResolvedValue({ list: [], count: 0 });
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
    expect(params.toString()).toBe('page=3&limit=5&name=ore&sort_by=created_at&sort_order=asc');
  });

  it('parses snapshot payloads when fetching preset details or import data', async () => {
    const payload = {
      id: 1,
      snapshot: JSON.stringify([{ id: 100 }]),
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

  it('serializes snapshots and routes share, like, unlike, update, and mine requests correctly', async () => {
    const apiPost = vi.fn().mockResolvedValue({});
    const apiPut = vi.fn().mockResolvedValue({});
    const apiDelete = vi.fn().mockResolvedValue({});
    const apiGet = vi.fn().mockResolvedValue({});
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
      snapshot: JSON.stringify(snapshot),
    });
    expect(apiPost).toHaveBeenNthCalledWith(2, '/share/presets', {
      preset_type: 'custom_point',
      sub_type: '',
      name: 'Point',
      description: 'Desc',
      is_public: true,
      snapshot: JSON.stringify(snapshot),
    });
    expect(apiPut).toHaveBeenCalledWith('/share/presets/9', { name: 'Updated', is_public: false });
    expect(apiDelete).toHaveBeenNthCalledWith(1, '/share/presets/9');
    expect(apiPost).toHaveBeenNthCalledWith(3, '/share/presets/7/like');
    expect(apiDelete).toHaveBeenNthCalledWith(2, '/share/presets/7/like');

    const [minePath, mineParams] = apiGet.mock.calls[0] as [string, URLSearchParams];
    const [likedPath, likedParams] = apiGet.mock.calls[1] as [string, URLSearchParams];
    expect(minePath).toBe('/share/presets/mine');
    expect(mineParams.toString()).toBe('page=2&limit=4&preset_type=custom_point');
    expect(likedPath).toBe('/share/presets/liked');
    expect(likedParams.toString()).toBe('page=3&limit=6&preset_type=electric_pole');
  });
});
