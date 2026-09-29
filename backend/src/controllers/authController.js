import { pool, seedOrganizationStarterData } from '../config/database.js';
import { env } from '../config/env.js';
import { signToken } from '../utils/jwt.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) {
    throw new ApiError(409, 'User already exists with that email.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const orgResult = await client.query(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
      [`${fullName}'s Organization`],
    );

    const orgId = orgResult.rows[0].id;
    const passwordHash = await hashPassword(password);

    const userResult = await client.query(
      `INSERT INTO users (organization_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, full_name, email, role, is_active, created_at`,
      [orgId, fullName, email.toLowerCase(), passwordHash, role],
    );

    const user = userResult.rows[0];
    if (env.USE_EMBEDDED_DATABASE) {
      await seedOrganizationStarterData(client, orgId, user.id);
    }

    const token = signToken({
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
      email: user.email,
      fullName: user.full_name,
    });

    await client.query('COMMIT');

    res.status(201).json({
      token,
      user: {
        id: user.id,
        organizationId: user.organization_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email.toLowerCase()],
  );

  if (!result.rows.length) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const user = result.rows[0];
  const valid = await comparePassword(password, user.password_hash);

  if (!valid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const token = signToken({
    userId: user.id,
    organizationId: user.organization_id,
    role: user.role,
    email: user.email,
    fullName: user.full_name,
  });

  res.json({
    token,
    user: {
      id: user.id,
      organizationId: user.organization_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.organization_id, u.full_name, u.email, u.role, u.is_active, u.created_at
     FROM users u
     WHERE u.id = $1`,
    [req.user.userId],
  );

  if (!result.rows.length) {
    throw new ApiError(404, 'User not found.');
  }

  res.json({ user: result.rows[0] });
});

export const logout = asyncHandler(async (_req, res) => {
  res.json({ message: 'Logged out successfully.' });
});
