import { describe, expect, it, vi } from 'vitest';

import { SklandPositionService } from './skland_position';

const createService = (response: unknown) => {
  const apiGet = vi.fn().mockResolvedValue(response);
  const service = new SklandPositionService({ serverService: { apiGet } as never });
  return { service, apiGet };
};

describe('SklandPositionService', () => {
  it('requests the position endpoint with the given roleId', async () => {
    const { service, apiGet } = createService({ online: false });

    await service.fetchPosition('111');

    expect(apiGet).toHaveBeenCalledWith('/user/game-roles/position', { roleId: '111' });
  });

  it('sends an empty roleId when none is given so the backend uses the default role', async () => {
    const { service, apiGet } = createService({ online: false });

    await service.fetchPosition();

    expect(apiGet).toHaveBeenCalledWith('/user/game-roles/position', { roleId: '' });
  });

  it('returns the backend payload unchanged', async () => {
    const payload = { roleId: '111', serverId: '2', online: true, mapId: 'map01', levelId: 'map01_lv002', x: 1, y: 2, z: 3 };
    const { service } = createService(payload);

    await expect(service.fetchPosition('111')).resolves.toEqual(payload);
  });
});
