import { describe, expect, it } from 'vitest';

import {
  differenceArray,
  differenceObjectArray,
  groupBy,
  intersectionArray,
  intersectionObjectArray,
  symmetricDifferenceArray,
  unionArray,
  unionObjectArray,
} from './object';

interface Item {
  id: number;
  group: string;
  label: string;
}

describe('object utilities', () => {
  it('groups array items by a property', () => {
    const items: Item[] = [
      { id: 1, group: 'a', label: 'one' },
      { id: 2, group: 'b', label: 'two' },
      { id: 3, group: 'a', label: 'three' },
    ];

    expect(groupBy(items, 'group')).toEqual({
      a: [items[0], items[2]],
      b: [items[1]],
    });
  });

  it('builds object unions with later items overriding earlier ones by key', () => {
    const left: Item[] = [
      { id: 1, group: 'a', label: 'old' },
      { id: 2, group: 'b', label: 'keep' },
    ];
    const right: Item[] = [
      { id: 1, group: 'a', label: 'new' },
      { id: 3, group: 'c', label: 'add' },
    ];

    expect(unionObjectArray(left, right, 'id')).toEqual([
      { id: 1, group: 'a', label: 'new' },
      { id: 2, group: 'b', label: 'keep' },
      { id: 3, group: 'c', label: 'add' },
    ]);
  });

  it('builds object intersections and differences with de-duplication', () => {
    const left: Item[] = [
      { id: 1, group: 'a', label: 'one' },
      { id: 1, group: 'a', label: 'duplicate wins later' },
      { id: 2, group: 'b', label: 'two' },
      { id: 3, group: 'c', label: 'three' },
    ];
    const right: Item[] = [
      { id: 2, group: 'x', label: 'match' },
      { id: 4, group: 'y', label: 'other' },
    ];

    expect(intersectionObjectArray(left, right, 'id')).toEqual([{ id: 2, group: 'b', label: 'two' }]);
    expect(differenceObjectArray(left, right, 'id')).toEqual([
      { id: 1, group: 'a', label: 'duplicate wins later' },
      { id: 3, group: 'c', label: 'three' },
    ]);
  });

  it('builds primitive set operations with de-duplication', () => {
    expect(unionArray([1, 2, 2], [2, 3])).toEqual([1, 2, 3]);
    expect(intersectionArray([1, 1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    expect(differenceArray([1, 1, 2, 3], [2, 4])).toEqual([1, 3]);
    expect(symmetricDifferenceArray([1, 2, 2], [2, 3, 4])).toEqual([1, 3, 4]);
  });
});
