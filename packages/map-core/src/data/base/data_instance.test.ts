import { describe, expect, it, vi } from 'vitest';

import { BaseDataInstance } from './data_instance';

interface TestData {
  levelLogicId: number;
  entityDataIdKey: string;
  templateId: string;
  entityType: string;
  position: { x: number; y: number; z: number };
  properties: Record<string, unknown>;
}

class TestDataInstance extends BaseDataInstance<TestData> {}

function createData(overrides: Partial<TestData> = {}): TestData {
  return {
    levelLogicId: 1,
    entityDataIdKey: 'entity_1',
    templateId: 'template_1',
    entityType: '#Entity',
    position: { x: 1, y: 2, z: 3 },
    properties: {},
    ...overrides,
  };
}

describe('BaseDataInstance', () => {
  it('exposes base computed fields and snapshots', () => {
    const instance = new TestDataInstance({
      data: createData({ properties: { name: 'Named Entity' } }),
      mapId: 'map_1' as never,
      mapDataManager: {} as never,
    });

    expect(instance.id).toBe(1);
    expect(instance.entityType).toBe('#Entity');
    expect(instance.entityDataIdKey).toBe('entity_1');
    expect(instance.name).toBe('Named Entity');
    expect(instance.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(instance.state).toEqual({
      marked: false,
      selected: false,
      active: false,
      visible: true,
    });
  });

  it('updates toggled state flags', () => {
    const instance = new TestDataInstance({
      data: createData(),
      mapId: 'map_1' as never,
      mapDataManager: {} as never,
    });

    instance.setMarked(true);
    instance.setSelected(true);
    instance.setActive(true);
    instance.setVisible(false);

    expect(instance.state).toEqual({
      marked: true,
      selected: true,
      active: true,
      visible: false,
    });
  });

  it('renames only when the instance is renameable', () => {
    const instance = new TestDataInstance({
      data: createData(),
      mapId: 'map_1' as never,
      mapDataManager: {} as never,
    });
    const loggerError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    instance.rename('Ignored');
    expect(instance.name).toBe('#Entity#1');

    (instance as unknown as { renameable: boolean }).renameable = true;
    instance.rename('Updated');

    expect(instance.name).toBe('Updated');
    loggerError.mockRestore();
  });
});
