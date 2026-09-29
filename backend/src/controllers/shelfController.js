import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const listShelves = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const includeArchived = req.query.includeArchived === 'true';

  const result = await pool.query(
    `SELECT * FROM shelves 
     WHERE store_id = $1 AND organization_id = $2 ${includeArchived ? '' : 'AND is_archived = false'}
     ORDER BY created_at DESC`,
    [storeId, req.user.organizationId],
  );

  res.json({ shelves: result.rows });
});

export const createShelf = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const storeCheck = await pool.query('SELECT id FROM stores WHERE id = $1 AND organization_id = $2', [storeId, req.user.organizationId]);

  if (!storeCheck.rows.length) {
    throw new ApiError(404, 'Store not found in your organization.');
  }

  const { name, category, aisleCode, description, expectedProducts } = req.body;

  const result = await pool.query(
    `INSERT INTO shelves (store_id, organization_id, created_by, name, category, aisle_code, description, expected_products)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [storeId, req.user.organizationId, req.user.userId, name, category, aisleCode || null, description || null, expectedProducts || null],
  );

  res.status(201).json({ shelf: result.rows[0] });
});

export const getShelfById = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM shelves WHERE id = $1 AND organization_id = $2', [req.params.shelfId, req.user.organizationId]);

  if (!result.rows.length) {
    throw new ApiError(404, 'Shelf not found.');
  }

  res.json({ shelf: result.rows[0] });
});

export const updateShelf = asyncHandler(async (req, res) => {
  const { shelfId } = req.params;
  const keys = Object.keys(req.body);
  if (!keys.length) {
    throw new ApiError(400, 'No shelf updates provided.');
  }

  const assignments = keys.map((key, idx) => `${snakeCase(key)} = $${idx + 1}`).join(', ');
  const values = keys.map((key) => req.body[key]);

  const result = await pool.query(
    `UPDATE shelves SET ${assignments} WHERE id = $${keys.length + 1} AND organization_id = $${keys.length + 2} RETURNING *`,
    [...values, shelfId, req.user.organizationId],
  );

  if (!result.rows.length) {
    throw new ApiError(404, 'Shelf not found.');
  }

  res.json({ shelf: result.rows[0] });
});

export const deleteShelf = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'UPDATE shelves SET is_archived = true WHERE id = $1 AND organization_id = $2 RETURNING *',
    [req.params.shelfId, req.user.organizationId],
  );

  if (!result.rows.length) {
    throw new ApiError(404, 'Shelf not found.');
  }

  res.json({ message: 'Shelf archived successfully.', shelf: result.rows[0] });
});

function snakeCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
