import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const withOrgScope = (orgId) => `organization_id = '${orgId}'`;

export const getStores = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = (req.query.search || '').trim();

  const offset = (page - 1) * limit;
  const clauses = ['organization_id = $1'];
  const values = [req.user.organizationId];

  if (search) {
    clauses.push('(LOWER(name) LIKE LOWER($2) OR LOWER(city) LIKE LOWER($2) OR LOWER(country) LIKE LOWER($2))');
    values.push(`%${search}%`);
  }

  const where = clauses.join(' AND ');
  const limitParameter = values.length + 1;
  const offsetParameter = values.length + 2;
  const rows = await pool.query(
    `SELECT * FROM stores WHERE ${where} ORDER BY created_at DESC LIMIT $${limitParameter} OFFSET $${offsetParameter}`,
    [...values, limit, offset],
  );

  const total = await pool.query(
    `SELECT COUNT(*)::int AS count FROM stores WHERE ${where}`,
    values,
  );

  res.json({
    stores: rows.rows,
    pagination: {
      page,
      limit,
      total: total.rows[0].count,
      pages: Math.ceil(total.rows[0].count / limit),
    },
  });
});

export const createStore = asyncHandler(async (req, res) => {
  const { name, addressLine1, addressLine2, city, stateRegion, country, postalCode, status } = req.body;

  const result = await pool.query(
    `INSERT INTO stores (organization_id, created_by, name, address_line_1, address_line_2, city, state_region, country, postal_code, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [req.user.organizationId, req.user.userId, name, addressLine1, addressLine2 || null, city, stateRegion || null, country, postalCode || null, status || 'ACTIVE'],
  );

  res.status(201).json({ store: result.rows[0] });
});

export const getStoreById = asyncHandler(async (req, res) => {
  const id = req.params.storeId;
  const result = await pool.query('SELECT * FROM stores WHERE id = $1 AND organization_id = $2', [id, req.user.organizationId]);

  if (!result.rows.length) {
    throw new ApiError(404, 'Store not found.');
  }

  res.json({ store: result.rows[0] });
});

export const updateStore = asyncHandler(async (req, res) => {
  const id = req.params.storeId;
  const update = req.body;
  const keys = Object.keys(update);

  if (!keys.length) {
    throw new ApiError(400, 'No store updates provided.');
  }

  const assignments = keys.map((key, idx) => `${snakeCase(key)} = $${idx + 1}`).join(', ');
  const values = keys.map((key) => update[key]);

  const result = await pool.query(
    `UPDATE stores SET ${assignments} WHERE id = $${keys.length + 1} AND organization_id = $${keys.length + 2} RETURNING *`,
    [...values, id, req.user.organizationId],
  );

  if (!result.rows.length) {
    throw new ApiError(404, 'Store not found.');
  }

  res.json({ store: result.rows[0] });
});

export const deleteStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  const result = await pool.query(
    `UPDATE stores SET status = 'ARCHIVED' WHERE id = $1 AND organization_id = $2 RETURNING *`,
    [storeId, req.user.organizationId],
  );

  if (!result.rows.length) {
    throw new ApiError(404, 'Store not found.');
  }

  res.json({ message: 'Store archived successfully.', store: result.rows[0] });
});

function snakeCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
