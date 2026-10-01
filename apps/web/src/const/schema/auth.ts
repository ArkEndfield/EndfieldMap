import * as z from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'username_too_short'),
  password: z.string().min(1, 'password_too_short'),
  agree: z.boolean().refine((value) => value, 'agree_required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'username_too_short')
    .max(20, 'username_too_long')
    .regex(/^[a-zA-Z0-9_]+$/, 'username_invalid'),
  password: z.string().min(8, 'password_too_short').max(72, 'password_too_long'),
  agree: z.boolean().refine((value) => value, 'agree_required'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'old_password_required'),
    newPassword: z.string().min(8, 'new_password_too_short').max(72, 'password_too_long'),
    confirmPassword: z.string().min(1, 'confirm_password_required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'password_mismatch',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
