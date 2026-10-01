import { describe, expect, it, vi } from 'vitest';

vi.mock('@endfieldmap/tools', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  LocalStorageValue: class {},
}));
vi.mock('@endfieldmap/map-service/service/user/auth', () => ({ UserAuthService: class {} }));
vi.mock('@endfieldmap/map-service/service/user/data', () => ({ UserDataService: class {} }));
vi.mock('@endfieldmap/map-service/service/db', () => ({ DatabaseService: class {} }));
vi.mock('@endfieldmap/map-service/service/service_emitter', () => ({
  serviceEmitter: { fire: vi.fn() },
  SERVICE_EVENT: {},
}));

import { UserService } from './index';

describe('user role transition', () => {
  it('waits for cancellation before opening a database or changing the request role', async () => {
    let finishCancellation: () => void = () => undefined;
    const cancellation = new Promise<void>((resolve) => {
      finishCancellation = resolve;
    });
    const stopSync = vi.fn(() => cancellation);
    const startSync = vi.fn();
    const createUserDB = vi.fn();
    const setUid = vi.fn();
    const switchUid = vi.fn();
    const service = Object.create(UserService.prototype) as UserService<unknown, unknown>;
    Object.assign(service, {
      databaseTransition: Promise.resolve(),
      confirmModal: async () => 1,
      auth: { userInfo: { id: 32 }, switchUid, currentUid: { value: '0' } },
      data: { syncService: { stopSync, startSync }, updateDB: vi.fn() },
      databaseService: { createUserDB },
      serverService: { setUid },
    });
    const pending = service.switchUid('1429794416');
    await vi.waitFor(() => expect(stopSync).toHaveBeenCalled());
    expect(createUserDB).not.toHaveBeenCalled();
    expect(setUid).not.toHaveBeenCalled();
    expect(switchUid).not.toHaveBeenCalled();
    finishCancellation();
    await pending;
    expect(createUserDB).toHaveBeenCalledWith(true, { userId: 32, roleId: '1429794416' }, false);
    expect(setUid).toHaveBeenCalledWith('1429794416');
    expect(startSync).toHaveBeenCalledOnce();
  });

  it('skips confirmation, sync restart and database work when switching to the current uid', async () => {
    const stopSync = vi.fn();
    const startSync = vi.fn();
    const createUserDB = vi.fn();
    const setUid = vi.fn();
    const switchUid = vi.fn();
    const confirmModal = vi.fn(async () => 1);
    const service = Object.create(UserService.prototype) as UserService<unknown, unknown>;
    Object.assign(service, {
      databaseTransition: Promise.resolve(),
      confirmModal,
      auth: { userInfo: { id: 32 }, switchUid, currentUid: { value: '0' } },
      data: { syncService: { stopSync, startSync, ensureSyncing: vi.fn() }, updateDB: vi.fn() },
      databaseService: { createUserDB },
      serverService: { setUid },
    });
    await service.switchUid('0');
    expect(confirmModal).not.toHaveBeenCalled();
    expect(stopSync).not.toHaveBeenCalled();
    expect(createUserDB).not.toHaveBeenCalled();
    expect(switchUid).not.toHaveBeenCalled();
    expect(startSync).not.toHaveBeenCalled();
  });
});
