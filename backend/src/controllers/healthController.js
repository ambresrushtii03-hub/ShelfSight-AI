import { asyncHandler } from '../utils/asyncHandler.js';
import { testDatabaseConnection } from '../config/database.js';

export const getHealth = asyncHandler(async (_req, res) => {
  const databaseAvailable = await testDatabaseConnection();
  res.status(databaseAvailable ? 200 : 503).json({
    ok: databaseAvailable,
    service: 'ShelfSight AI API',
    database: databaseAvailable ? 'available' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
});
