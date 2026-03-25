import { describe, expect, it, vi } from 'vitest';

import { EntitySearchRegistry } from './entity_search_registry';

interface TestInstance {
  id: number;
  kind: string;
}

describe('EntitySearchRegistry', () => {
  it('searches registrations across multiple map ids in order', () => {
    const registry = new EntitySearchRegistry();
    const first = { id: 1, kind: 'first' } as never;
    const second = { id: 2, kind: 'second' } as never;

    registry.register({
      matchesInstance: () => false,
      searchById: (mapId, id) => (mapId === 'map-b' && id === 1 ? first : undefined),
      isGroupVisible: vi.fn(),
    });
    registry.register({
      matchesInstance: () => false,
      searchById: (mapId, id) => (mapId === 'map-c' && id === 2 ? second : undefined),
      isGroupVisible: vi.fn(),
    });

    expect(registry.searchById(['map-a', 'map-b'], 1)).toBe(first);
    expect(registry.searchById(['map-a', 'map-c'], 2)).toBe(second);
    expect(registry.searchById(['map-a'], 99)).toBeUndefined();
  });

  it('finds matching registrations and delegates visibility operations', () => {
    const registry = new EntitySearchRegistry();
    const toggleVisible = vi.fn();
    const isGroupVisible = vi.fn().mockReturnValue(false);
    const matchingInstance = { id: 1, kind: 'target' } as never;

    registry.register({
      matchesInstance: (instance) => ((instance as unknown as TestInstance).kind === 'other'),
      searchById: () => undefined,
      isGroupVisible: vi.fn().mockReturnValue(true),
    });
    registry.register({
      matchesInstance: (instance) => ((instance as unknown as TestInstance).kind === 'target'),
      searchById: () => undefined,
      isGroupVisible,
    });

    expect(registry.findRegistration(matchingInstance)).toMatchObject({
      isGroupVisible,
    });

    expect(registry.isGroupVisible(matchingInstance)).toBe(false);
  });

  it('defaults group visibility to true when no registration matches', () => {
    const registry = new EntitySearchRegistry();

    expect(registry.isGroupVisible({ id: 1 } as never)).toBe(true);
  });
});
