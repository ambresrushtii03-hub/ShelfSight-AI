import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT
      COUNT(*)::int AS totalAudits,
      COALESCE(AVG(overall_score), 0)::float AS averageCompliance,
      COALESCE((SELECT COUNT(*)::int FROM tasks WHERE organization_id = $1 AND status = 'OPEN'), 0) AS openTasks,
      COALESCE((SELECT COUNT(*)::int FROM audit_findings WHERE organization_id = $1 AND severity IN ('HIGH', 'CRITICAL')), 0) AS highPriorityIssues,
      COALESCE((SELECT COUNT(*)::int FROM audit_findings WHERE organization_id = $1 AND issue_type = 'OUT_OF_STOCK'), 0) AS outOfStockFindings
    FROM audits WHERE organization_id = $1`,
    [req.user.organizationId],
  );

  res.json({ summary: result.rows[0] || { totalAudits: 0, averageCompliance: 0, openTasks: 0, highPriorityIssues: 0, outOfStockFindings: 0 } });
});

export const getAuditTrend = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 30);
  const result = await pool.query(
    `SELECT DATE(created_at) AS date, COUNT(*)::int AS audits, AVG(overall_score)::float AS average_score 
     FROM audits WHERE organization_id = $1 AND created_at >= NOW() - ($2 || ' days')::interval
     GROUP BY DATE(created_at)
     ORDER BY DATE(created_at) DESC`,
    [req.user.organizationId, days],
  );

  res.json({ data: result.rows });
});

export const getIssueDistribution = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT issue_type AS name, COUNT(*)::int AS value FROM audit_findings WHERE organization_id = $1 GROUP BY issue_type ORDER BY value DESC`,
    [req.user.organizationId],
  );

  res.json({ data: result.rows });
});

export const getStorePerformance = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT s.name, AVG(a.overall_score)::float AS score
     FROM stores s
     LEFT JOIN audits a ON a.store_id = s.id AND a.organization_id = s.organization_id
     WHERE s.organization_id = $1
     GROUP BY s.id, s.name
     ORDER BY score DESC NULLS LAST`,
    [req.user.organizationId],
  );

  res.json({ data: result.rows });
});

export const getTaskSummary = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT status, COUNT(*)::int AS count FROM tasks WHERE organization_id = $1 GROUP BY status ORDER BY status`,
    [req.user.organizationId],
  );

  res.json({ data: result.rows });
});
