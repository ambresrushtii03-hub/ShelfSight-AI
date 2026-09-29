import { z } from 'zod';

const boundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
}).nullable();

const detectedProductSchema = z.object({
  productName: z.string().min(1).max(255).nullable(),
  brand: z.string().min(1).max(255).nullable(),
  status: z.enum(['available', 'low_stock', 'out_of_stock', 'misplaced', 'unknown']),
  confidence: z.number().min(0).max(1),
  estimatedFacings: z.number().int().min(0).nullable(),
  notes: z.string().max(1000),
});

const aiIssueSchema = z.object({
  issueType: z.enum([
    'OUT_OF_STOCK',
    'LOW_STOCK',
    'MISPLACED_PRODUCT',
    'PRICE_LABEL_MISMATCH',
    'PLANOGRAM_VIOLATION',
    'UNKNOWN_PRODUCT',
    'DAMAGED_PACKAGING',
    'SHELF_DISORGANIZATION',
    'EMPTY_SHELF_SPACE',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  productName: z.string().min(1).max(255).nullable(),
  brand: z.string().min(1).max(255).nullable(),
  estimatedFacings: z.number().int().min(0).nullable(),
  confidence: z.number().min(0).max(1),
  description: z.string().min(5).max(2000),
  recommendedAction: z.string().min(5).max(1000),
  boundingBox: boundingBoxSchema,
});

export const geminiShelfAnalysisSchema = z.object({
  overallShelfScore: z.number().int().min(0).max(100),
  summary: z.string().min(20).max(500),
  imageQualityNotes: z.string().min(3).max(1000),
  detectedProducts: z.array(detectedProductSchema).max(100),
  issues: z.array(aiIssueSchema).max(100),
});
