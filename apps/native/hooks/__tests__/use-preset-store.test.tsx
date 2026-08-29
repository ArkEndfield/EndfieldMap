import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useOptimisticList } from '../use-preset-store';

// 被测 hook 不触服务；mock 掉模块顶部拉起的整条 map-service 依赖链。
jest.mock('@/services/map-service', () => ({
  service: { dataService: {}, langHashService: {} },
}));
jest.mock('@/utils/error-handler', () => ({ catchErrorWithTip: jest.fn() }));

interface Item {
  id: number;
  name: string;
}

const items: Item[] = [
  { id: 1, name: 'a' },
  { id: 2, name: 'b' },
  { id: 3, name: 'c' },
];

beforeEach(() => {
  jest.clearAllMocks?.();
});

describe('useOptimisticList', () => {
  it('returns data unchanged when no operations are pending', async () => {
    const { result } = await renderHook(() => useOptimisticList<Item>());
    expect(result.current.merge(items)).toBe(items);
    expect(result.current.hasPending).toBe(false);
  });

  it('applies updates onto matching items and reports pending', async () => {
    const { result } = await renderHook(() => useOptimisticList<Item>());

    await act(async () => result.current.apply(2, { name: 'renamed' }));

    expect(result.current.hasPending).toBe(true);
    expect(result.current.merge(items)).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'renamed' },
      { id: 3, name: 'c' },
    ]);
  });

  it('filters removed items out of merged data', async () => {
    const { result } = await renderHook(() => useOptimisticList<Item>());

    await act(async () => result.current.remove(3));

    expect(result.current.merge(items).map((i) => i.id)).toEqual([1, 2]);
  });

  it('revert undoes a single id while keeping others', async () => {
    const { result } = await renderHook(() => useOptimisticList<Item>());

    await act(async () => {
      result.current.apply(1, { name: 'x' });
      result.current.apply(2, { name: 'y' });
    });
    await act(async () => result.current.revert(1));

    expect(result.current.merge(items)).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'y' },
      { id: 3, name: 'c' },
    ]);
  });

  it('clear drops every pending operation', async () => {
    const { result } = await renderHook(() => useOptimisticList<Item>());

    await act(async () => result.current.apply(1, { name: 'x' }));
    await act(async () => result.current.clear());

    expect(result.current.hasPending).toBe(false);
    expect(result.current.merge(items)).toBe(items);
  });

  it('honours a custom getItemId after prop identity changes (latest-ref sync)', async () => {
    // latest-ref 经 effect 同步：传入新的 getId 函数后，
    // 下一次 merge 必须按新函数取键。
    type Keyed = { key: string; id: number; name: string };
    const initial = await renderHook(
      ({ getId }: { getId: (item: Keyed) => string | number }) =>
        useOptimisticList<Keyed>(getId),
      { initialProps: { getId: (i: { key: string }) => i.key } as { getId: (item: Keyed) => string | number } },
    );

    const keyed: Keyed[] = [
      { key: 'k1', id: 9, name: 'a' },
      { key: 'k2', id: 8, name: 'b' },
    ];

    await act(async () => initial.result.current.apply('k2', { name: 'renamed' }));
    expect(initial.result.current.merge(keyed)[1].name).toBe('renamed');

    // 换一个以 id 取键的函数：旧键 k2 的操作不应再命中。
    await initial.rerender({ getId: (i: { id: number }) => i.id });
    expect(initial.result.current.merge(keyed)).toEqual(keyed);
  });
});
