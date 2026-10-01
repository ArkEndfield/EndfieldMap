import { describe, expect, it } from 'vitest';

import { changePasswordSchema, registerSchema } from './auth';

describe('DijiangV2 password validation', () => {
  it.each([6, 7, 73])('rejects a %i-character registration password', (length) => {
    expect(registerSchema.safeParse({ username: 'web_test', password: 'a'.repeat(length), agree: true }).success).toBe(
      false
    );
  });

  it.each([8, 72])('accepts a %i-character registration password', (length) => {
    expect(registerSchema.safeParse({ username: 'web_test', password: 'a'.repeat(length), agree: true }).success).toBe(
      true
    );
  });

  it.each([7, 73])('rejects a %i-character replacement password', (length) => {
    const password = 'a'.repeat(length);
    expect(
      changePasswordSchema.safeParse({ oldPassword: 'old_password', newPassword: password, confirmPassword: password })
        .success
    ).toBe(false);
  });

  it('still requires matching passwords and explicit agreement', () => {
    expect(
      changePasswordSchema.safeParse({
        oldPassword: 'old_password',
        newPassword: 'new_password',
        confirmPassword: 'different_password',
      }).success
    ).toBe(false);
    expect(registerSchema.safeParse({ username: 'web_test', password: 'password123', agree: false }).success).toBe(
      false
    );
  });
});
