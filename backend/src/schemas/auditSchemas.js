import { z } from 'zod';

export const createAuditMetadataSchema = z.object({
  body: z.object({
    storeId: z.string().uuid(),
    shelfId: z.string().uuid(),
    auditNotes: z.string().max(1000).optional(),
  }),
});

export const auditQuerySchema = z.object({
  query: z.object({
    storeId: z.string().uuid().optional(),
    shelfId: z.string().uuid().optional(),
    status: z.string().optional(),
    minScore: z.coerce.number().min(0).max(100).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
  }),
});
