import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const getFindings = asyncHandler(async (req, res) => {
  let query = 'SELECT * FROM audit_findings WHERE organization_id = $1';
  const values = [req.user.organizationId];
  let index = 2;

  if (req.query.issueType) {
    query += ` AND issue_type = $${index}`; values.push(req.query.issueType); index += 1;
  }
  if (req.query.severity) {
    query += ` AND severity = $${index}`; values.push(req.query.severity); index += 1;
  }
  if (req.query.reviewStatus) {
    query += ` AND review_status = $${index}`; values.push(req.query.reviewStatus); index += 1;
  }
  if (req.query.storeId) {
    const auditIds = await pool.query('SELECT id FROM audits WHERE store_id = $1 AND organization_id = $2', [req.query.storeId, req.user.organizationId]);
    const ids = auditIds.rows.map((row) => row.id);
    if (!ids.length) return res.json({ findings: [], pagination: { total: 0 } });
    query += ` AND audit_id = ANY($${index})`; values.push(ids); index += 1;
  }

  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, values);
  res.json({ findings: result.rows });
});

export const getFindingById = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM audit_findings WHERE id = $1 AND organization_id = $2', [req.params.findingId, req.user.organizationId]);
  if (!result.rows.length) throw new ApiError(404, 'Finding not found.');
  res.json({ finding: result.rows[0] });
});

export const reviewFinding = asyncHandler(async (req, res) => {
  const { reviewStatus, reviewerNote } = req.body;
  const findingResult = await pool.query('SELECT * FROM audit_findings WHERE id = $1 AND organization_id = $2', [req.params.findingId, req.user.organizationId]);
  if (!findingResult.rows.length) throw new ApiError(404, 'Finding not found.');

  const finding = findingResult.rows[0];
  const result = await pool.query(
    `UPDATE audit_findings SET review_status = $1, reviewer_note = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW() WHERE id = $4 AND organization_id = $5 RETURNING *`,
    [reviewStatus, reviewerNote || null, req.user.userId, req.params.findingId, req.user.organizationId],
  );

  await pool.query(
    'INSERT INTO audit_reviews (audit_id, finding_id, organization_id, reviewer_id, decision, note) VALUES ($1, $2, $3, $4, $5, $6)',
    [finding.audit_id, finding.id, req.user.organizationId, req.user.userId, reviewStatus, reviewerNote || null],
  );

  if (reviewStatus === 'RESOLVED') {
    await pool.query('UPDATE tasks SET status = $1, updated_at = NOW() WHERE finding_id = $2 AND organization_id = $3 AND status IN (\'OPEN\', \'IN_PROGRESS\')', ['RESOLVED', finding.id, req.user.organizationId]);
  }

  res.json({ finding: result.rows[0] });
});
