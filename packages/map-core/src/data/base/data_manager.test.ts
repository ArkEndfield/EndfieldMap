import type { BaseEntityDataWithInfo } from '@endfieldmap/map-core/types/entity';
import { describe, expect, it } from 'vitest';

import { BaseDataInstance } from './data_instance';
import { BaseDataManager } from './data_manager';

interface TestData extends BaseEntityDataWithInfo {
  properties: Record<string, unknown>;
}

class TestInstance extends BaseDataInstance<TestData> {}

class TestManager extends BaseDataManager<TestData, TestInstance> {
  protected createInstance(data: TestData): TestInstance {
    return new TestInstance({
      data,
      mapId: this.mapId,
      mapDataManager: this.mapDataManager,
    });
  }
}

function createData(id: number): TestData {
  return {
    levelLogicId: id,
    entityDataIdKey: `entity_${id}`,
    templateId: `template_${id}`,
    entityType: '#Entity',
    position: { x: id, y: 0, z: id },
    properties: {},
  };
}

describe('BaseDataManager', () => {
  it('adds, finds, filters, iterates, and removes instances', () => {
    const manager = new TestManager({
      mapId: 'map_1' as never,
      mapDataManager: {} as never,
    });

    const instance = manager.add(createData(1));
    manager.addBatch([createData(2), createData(2), createData(3)]);

    expect(manager.count).toBe(3);
    expect(manager.getById(1)).toBe(instance);
    expect(manager.has(2)).toBe(true);
    expect(manager.find((item) => item.id === 3)?.id).toBe(3);
    expect(manager.filter((item) => item.id >= 2).map((item) => item.id)).toEqual([2, 3]);

    const iterated: number[] = [];
    manager.forEach((item) => iterated.push(item.id));
    expect(iterated).toEqual([1, 2, 3]);

    expect(manager.remove(2)).toBe(true);
    expect(manager.remove(999)).toBe(false);
    expect(manager.count).toBe(2);
  });

  it('tracks marked, selected, and visible subsets', () => {
    const manager = new TestManager({
      mapId: 'map_1' as never,
      mapDataManager: {} as never,
    });

    const a = manager.add(createData(1));
    const b = manager.add(createData(2));

    a.setMarked(true);
    b.setSelected(true);
    b.setVisible(false);

    expect(manager.markedInstances.map((item) => item.id)).toEqual([1]);
    expect(manager.markedCount).toBe(1);
    expect(manager.selectedInstances.map((item) => item.id)).toEqual([2]);
    expect(manager.selectedCount).toBe(1);
    expect(manager.visibleInstances.map((item) => item.id)).toEqual([1]);
  });

  it('clears selected state and updates visibility in batch', () => {
    const manager = new TestManager({
      mapId: 'map_1' as never,
      mapDataManager: {} as never,
    });

    const a = manager.add(createData(1));
    const b = manager.add(createData(2));

    a.setSelected(true);
    b.setSelected(true);
    manager.clearAllSelected();
    manager.setAllVisible(false);

    expect(manager.selectedCount).toBe(0);
    expect(a.visible).toBe(false);
    expect(b.visible).toBe(false);
  });

  it('clears all instances and rejects duplicate ids on add', () => {
    const manager = new TestManager({
      mapId: 'map_1' as never,
      mapDataManager: {} as never,
    });

    manager.add(createData(1));
    expect(() => manager.add(createData(1))).toThrow('Instance with id 1 already exists');

    manager.clear();

    expect(manager.count).toBe(0);
    expect(manager.dataList).toEqual([]);
  });
});
