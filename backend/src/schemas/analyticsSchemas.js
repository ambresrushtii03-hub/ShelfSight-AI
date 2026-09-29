import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().refine((value) => [7, 30, 90, 365].includes(value), {
      message: 'days must be one of: 7, 30, 90, 365',
    }).optional(),
  }),
});
