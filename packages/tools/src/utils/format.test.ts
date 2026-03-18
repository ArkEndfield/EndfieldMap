import { describe, expect, it } from 'vitest';

import { numberPadString } from './format';

describe('numberPadString', () => {
  it('pads values that are shorter than the target length', () => {
    expect(numberPadString(7, 3)).toBe('007');
    expect(numberPadString(42, 5, 'x')).toBe('xxx42');
  });

  it('returns the original number string when no padding is needed', () => {
    expect(numberPadString(1234, 2)).toBe('1234');
    expect(numberPadString(99, 2, 8)).toBe('99');
  });

  it('supports negative numbers by padding the full string representation', () => {
    expect(numberPadString(-5, 3)).toBe('0-5');
  });
});
