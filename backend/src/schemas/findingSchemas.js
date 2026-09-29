import { z } from 'zod';

export const reviewFindingSchema = z.object({
  body: z.object({
    reviewStatus: z.enum(['NEEDS_REVIEW', 'CONFIRMED', 'REJECTED', 'RESOLVED']),
    reviewerNote: z.string().max(1000).optional(),
  }),
});
