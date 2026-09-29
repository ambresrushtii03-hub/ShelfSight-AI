import { z } from 'zod';

export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    addressLine1: z.string().min(1).max(255),
    addressLine2: z.string().max(255).optional(),
    city: z.string().min(1).max(100),
    stateRegion: z.string().max(100).optional(),
    country: z.string().min(1).max(100),
    postalCode: z.string().max(30).optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  }),
});

export const updateStoreSchema = createStoreSchema.partial();
