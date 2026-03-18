import { describe, expect, it } from 'vitest';

import { cn } from './style';

describe('cn', () => {
  it('merges truthy class names and removes falsy values', () => {
    expect(cn('px-2', false, null, undefined, 'py-1')).toBe('px-2 py-1');
  });

  it('resolves tailwind conflicts using tailwind-merge', () => {
    expect(cn('px-2', 'px-4', 'text-sm', 'text-lg')).toBe('px-4 text-lg');
  });
});
