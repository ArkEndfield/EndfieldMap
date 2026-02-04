import * as z from 'zod';
// TODO: i18n
export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(50, '密码最多50个字符'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;