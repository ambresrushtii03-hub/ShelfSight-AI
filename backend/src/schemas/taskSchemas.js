import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    assignedTo: z.string().uuid().optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']).default('OPEN'),
    dueDate: z.string().optional(),
    storeId: z.string().uuid().optional(),
    auditId: z.string().uuid().optional(),
    findingId: z.string().uuid().optional(),
  }),
});

export const updateTaskSchema = createTaskSchema.partial();
