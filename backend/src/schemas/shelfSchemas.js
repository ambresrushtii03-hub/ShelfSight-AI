import { z } from 'zod';

export const createShelfSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150),
    category: z.string().min(1).max(100),
    aisleCode: z.string().max(50).optional(),
    description: z.string().max(1000).optional(),
    expectedProducts: z.string().max(3000).optional(),
  }),
});

export const updateShelfSchema = createShelfSchema.partial();
