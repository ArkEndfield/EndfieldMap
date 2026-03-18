import { describe, expect, it } from 'vitest';

import { AdapterRegistry } from './adapter_registry';

describe('AdapterRegistry', () => {
  it('throws until an adapter is registered', () => {
    const registry = new AdapterRegistry();

    expect(registry.hasAdapter).toBe(false);
    expect(() => registry.adapter).toThrow('[AdapterRegistry] Adapter not registered. Call register() first.');
  });

  it('exposes the registered adapter and can dispose it', () => {
    const registry = new AdapterRegistry();
    const adapter = {
      event: {},
      destroy: () => undefined,
    };

    registry.register(adapter as never);

    expect(registry.hasAdapter).toBe(true);
    expect(registry.adapter).toBe(adapter);

    registry.dispose();

    expect(registry.hasAdapter).toBe(false);
    expect(() => registry.adapter).toThrow('[AdapterRegistry] Adapter not registered. Call register() first.');
  });
});
