import { describe, expect, it } from 'vitest';

import { ShareSelectStore } from './share_select_store';

describe('ShareSelectStore', () => {
  it('setSelect with keys shows the strip', () => {
    const store = new ShareSelectStore();
    store.setSelect(['a', 'b']);
    expect(store.selectKeys).toEqual(['a', 'b']);
    expect(store.visible).toBe(true);
  });

  it('setSelect with empty keys keeps the strip hidden', () => {
    const store = new ShareSelectStore();
    store.setSelect([]);
    expect(store.selectKeys).toEqual([]);
    expect(store.visible).toBe(false);
  });

  it('close hides the strip and clears keys', () => {
    const store = new ShareSelectStore();
    store.setSelect(['a']);
    store.close();
    expect(store.visible).toBe(false);
    expect(store.selectKeys).toEqual([]);
  });
});
