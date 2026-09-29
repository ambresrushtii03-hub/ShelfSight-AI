import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).refine((value) => /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value), {
      message: 'Password must contain uppercase, lowercase, and a number.',
    }),
    role: z.enum(['ADMIN', 'MANAGER', 'AUDITOR']),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});
