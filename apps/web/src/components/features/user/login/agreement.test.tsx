import { type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { AgreementConsent } from './agreement';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@endfieldmap/web-components', async () => {
  const { createElement } = await import('react');
  return {
    Dialog: () => null,
    CheckboxToggle: ({ checked, label }: { checked: boolean; label: ReactNode }) =>
      createElement('button', { role: 'switch', 'aria-checked': checked }, label),
  };
});

describe('AgreementConsent', () => {
  it.each([false, true])('keeps agreement links outside the consent button when checked=%s', (checked) => {
    const html = renderToStaticMarkup(<AgreementConsent checked={checked} onToggle={vi.fn()} onClick={vi.fn()} />);
    let depth = 0;
    let buttons = 0;
    for (const [tag] of html.matchAll(/<\/?button\b[^>]*>/g)) {
      if (tag.startsWith('</')) depth--;
      else {
        depth++;
        buttons++;
        expect(depth).toBe(1);
      }
    }
    expect(depth).toBe(0);
    expect(buttons).toBe(3);
    expect(html).toContain(`aria-checked="${checked}"`);
  });
});
