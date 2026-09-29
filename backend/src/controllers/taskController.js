import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const getTasks = asyncHandler(async (req, res) => {
  let query = 'SELECT * FROM tasks WHERE organization_id = $1';
  const values = [req.user.organizationId];
  let index = 2;

  if (req.query.status) { query += ` AND status = $${index}`; values.push(req.query.status); index += 1; }
  if (req.query.priority) { query += ` AND priority = $${index}`; values.push(req.query.priority); index += 1; }
  if (req.query.assignedTo) { query += ` AND assigned_to = $${index}`; values.push(req.query.assignedTo); index += 1; }
  if (req.query.storeId) { query += ` AND store_id = $${index}`; values.push(req.query.storeId); index += 1; }

  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, values);
  res.json({ tasks: result.rows });
});

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, assignedTo, status, dueDate, storeId, auditId, findingId } = req.body;

  if (!req.user || !['ADMIN', 'MANAGER'].includes(req.user.role) && assignedTo) {
    throw new ApiError(403, 'Only managers and administrators can assign tasks.');
  }

  if (!storeId) throw new ApiError(400, 'Store ID is required.');
  const storeResult = await pool.query('SELECT id FROM stores WHERE id = $1 AND organization_id = $2', [storeId, req.user.organizationId]);
  if (!storeResult.rows.length) throw new ApiError(404, 'Store not found.');

  const result = await pool.query(
    `INSERT INTO tasks (organization_id, store_id, audit_id, finding_id, created_by, assigned_to, title, description, priority, status, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [req.user.organizationId, storeId, auditId || null, findingId || null, req.user.userId, assignedTo || null, title, description, priority || 'MEDIUM', status || 'OPEN', dueDate || null],
  );

  res.status(201).json({ task: result.rows[0] });
});

export const getTaskById = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1 AND organization_id = $2', [req.params.taskId, req.user.organizationId]);
  if (!result.rows.length) throw new ApiError(404, 'Task not found.');
  res.json({ task: result.rows[0] });
});

export const updateTask = asyncHandler(async (req, res) => {
  const { status, resolutionNote, assignedTo, priority, title, description, dueDate } = req.body;
  const task = await pool.query('SELECT * FROM tasks WHERE id = $1 AND organization_id = $2', [req.params.taskId, req.user.organizationId]);
  if (!task.rows.length) throw new ApiError(404, 'Task not found.');

  if (status === 'RESOLVED' && !resolutionNote) throw new ApiError(400, 'Resolution note is required when resolving a task.');

  if (assignedTo && !['ADMIN', 'MANAGER'].includes(req.user.role)) {
    throw new ApiError(403, 'Only managers and administrators can assign tasks.');
  }

  const result = await pool.query(
    `UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), priority = COALESCE($3, priority), assigned_to = COALESCE($4, assigned_to), status = COALESCE($5, status), due_date = COALESCE($6, due_date), resolution_note = COALESCE($7, resolution_note), resolved_at = CASE WHEN $5 = 'RESOLVED' THEN NOW() ELSE resolved_at END, updated_at = NOW()
     WHERE id = $8 AND organization_id = $9 RETURNING *`,
    [title || null, description || null, priority || null, assignedTo || null, status || null, dueDate || null, resolutionNote || null, req.params.taskId, req.user.organizationId],
  );

  res.json({ task: result.rows[0] });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND organization_id = $2 RETURNING *', [req.params.taskId, req.user.organizationId]);
  if (!result.rows.length) throw new ApiError(404, 'Task not found.');
  res.json({ message: 'Task deleted successfully.' });
});
