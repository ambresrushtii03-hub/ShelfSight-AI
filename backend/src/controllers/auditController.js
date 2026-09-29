import fs from 'fs';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { analyzeShelfImage } from '../services/geminiService.js';
import { buildPagination } from '../utils/pagination.js';

export const createAudit = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Image file is required.');
  }

  const { storeId, shelfId, auditNotes } = req.body;

  const storeExists = await pool.query(
    'SELECT id FROM stores WHERE id = $1 AND organization_id = $2',
    [storeId, req.user.organizationId],
  );

  if (!storeExists.rows.length) {
    throw new ApiError(404, 'Store not found in your organization.');
  }

  const shelfExists = await pool.query(
    'SELECT s.*, st.organization_id FROM shelves s JOIN stores st ON st.id = s.store_id WHERE s.id = $1 AND s.organization_id = $2',
    [shelfId, req.user.organizationId],
  );

  if (!shelfExists.rows.length) {
    throw new ApiError(404, 'Shelf not found in your organization.');
  }

  const imagePath = req.file.path;
  const audit = await pool.query(
    `INSERT INTO audits (organization_id, store_id, shelf_id, created_by, image_path, image_original_name, image_mime_type, image_size_bytes, audit_notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'UPLOADED')
     RETURNING *`,
    [req.user.organizationId, storeId, shelfId, req.user.userId, imagePath, req.file.originalname, req.file.mimetype, req.file.size, auditNotes || null],
  );

  res.status(201).json({ audit: audit.rows[0], message: 'Audit created and queued for analysis.' });
});

export const analyzeAudit = asyncHandler(async (req, res) => {
  const { auditId } = req.params;
  const auditResult = await pool.query('SELECT * FROM audits WHERE id = $1 AND organization_id = $2', [auditId, req.user.organizationId]);
  if (!auditResult.rows.length) throw new ApiError(404, 'Audit not found.');

  const audit = auditResult.rows[0];
  if (!fs.existsSync(audit.image_path)) {
    throw new ApiError(400, 'Image file is missing.');
  }
  if (!env.GEMINI_API_KEY) {
    throw new ApiError(503, 'Gemini is not configured. Add GEMINI_API_KEY to backend/.env, restart the API, then retry this uploaded audit.');
  }

  await pool.query('UPDATE audits SET status = $1, updated_at = NOW() WHERE id = $2', ['PROCESSING', auditId]);

  const shelf = await pool.query('SELECT * FROM shelves WHERE id = $1 AND organization_id = $2', [audit.shelf_id, req.user.organizationId]);
  const store = await pool.query('SELECT * FROM stores WHERE id = $1 AND organization_id = $2', [audit.store_id, req.user.organizationId]);

  try {
    const output = await analyzeShelfImage({
      imagePath: audit.image_path,
      imageMimeType: audit.image_mime_type,
      auditContext: {
        storeName: store.rows[0]?.name || 'Store',
        storeCity: store.rows[0]?.city || 'Unknown city',
        storeCountry: store.rows[0]?.country || 'Unknown country',
        shelfName: shelf.rows[0]?.name || 'Shelf',
        shelfCategory: shelf.rows[0]?.category || 'Other',
        shelfDescription: shelf.rows[0]?.description || 'No description',
        expectedProducts: shelf.rows[0]?.expected_products || 'Not provided',
        auditNotes: audit.audit_notes || 'No notes',
      },
    });

    const findingsToSave = output.analysis.issues.map((item) => ({
      issue_type: item.issueType,
      severity: item.severity,
      product_name: item.productName,
      brand: item.brand,
      estimated_facings: item.estimatedFacings,
      confidence: Number(item.confidence),
      description: item.description,
      recommended_action: item.recommendedAction,
      bounding_box: item.boundingBox,
    }));

    const overallScore = output.analysis.overallShelfScore;
    await pool.query(
      `UPDATE audits SET status = 'COMPLETED', overall_score = $1, ai_summary = $2, ai_model = $3, ai_raw_response = $4, completed_at = NOW(), updated_at = NOW() WHERE id = $5`,
      [overallScore, output.analysis.summary, env.GEMINI_MODEL, output.raw, auditId],
    );

    for (const item of findingsToSave) {
      await pool.query(
        `INSERT INTO audit_findings (audit_id, organization_id, issue_type, severity, product_name, brand, estimated_facings, confidence, description, recommended_action, bounding_box, review_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'NEEDS_REVIEW')`,
        [auditId, req.user.organizationId, item.issue_type, item.severity, item.product_name, item.brand, item.estimated_facings, item.confidence, item.description, item.recommended_action, item.bounding_box],
      );
    }

    res.json({ message: 'AIAudit analysis complete.', auditId, summary: output.analysis.summary, score: overallScore });
  } catch (error) {
    const failureMessage = getAnalysisFailureMessage(error);
    console.error('[AUDIT ANALYSIS FAILED]', {
      auditId,
      code: error.code,
      status: error.status,
      message: error.message,
    });
    await pool.query(
      `UPDATE audits SET status = 'FAILED', processing_error = $1, updated_at = NOW() WHERE id = $2`,
      [failureMessage, auditId],
    );

    throw new ApiError(502, failureMessage);
  }
});

export const getAudits = asyncHandler(async (req, res) => {
  const pageInfo = buildPagination(req.query.page, req.query.limit);
  let query = 'SELECT * FROM audits WHERE organization_id = $1';
  const values = [req.user.organizationId];
  let idx = 2;

  if (req.query.storeId) {
    query += ` AND store_id = $${idx}`; values.push(req.query.storeId); idx += 1;
  }
  if (req.query.shelfId) {
    query += ` AND shelf_id = $${idx}`; values.push(req.query.shelfId); idx += 1;
  }
  if (req.query.status) {
    query += ` AND status = $${idx}`; values.push(req.query.status); idx += 1;
  }
  if (req.query.minScore) {
    query += ` AND overall_score >= $${idx}`; values.push(Number(req.query.minScore)); idx += 1;
  }

  query += ` ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  values.push(pageInfo.limit, pageInfo.offset);

  const result = await pool.query(query, values);
  const total = await pool.query(`SELECT COUNT(*)::int AS count FROM audits WHERE organization_id = $1`, [req.user.organizationId]);

  res.json({ audits: result.rows, pagination: { page: pageInfo.page, limit: pageInfo.limit, total: total.rows[0].count } });
});

export const getAuditById = asyncHandler(async (req, res) => {
  const auditQuery = await pool.query(
    `SELECT a.*, s.name AS store_name, sh.name AS shelf_name 
     FROM audits a
     JOIN stores s ON s.id = a.store_id
     JOIN shelves sh ON sh.id = a.shelf_id
     WHERE a.id = $1 AND a.organization_id = $2`,
    [req.params.auditId, req.user.organizationId],
  );

  if (!auditQuery.rows.length) throw new ApiError(404, 'Audit not found.');

  const findings = await pool.query('SELECT * FROM audit_findings WHERE audit_id = $1 AND organization_id = $2 ORDER BY created_at DESC', [req.params.auditId, req.user.organizationId]);
  const tasks = await pool.query('SELECT * FROM tasks WHERE audit_id = $1 AND organization_id = $2 ORDER BY created_at DESC', [req.params.auditId, req.user.organizationId]);

  res.json({ audit: auditQuery.rows[0], findings: findings.rows, tasks: tasks.rows });
});

export const updateAudit = asyncHandler(async (req, res) => {
  const keys = Object.keys(req.body);
  if (!keys.length) throw new ApiError(400, 'No fields provided.');

  const assignments = keys.map((key, index) => `${toSnakeCase(key)} = $${index + 1}`).join(', ');
  const values = keys.map((key) => req.body[key]);

  const result = await pool.query(
    `UPDATE audits SET ${assignments} WHERE id = $${keys.length + 1} AND organization_id = $${keys.length + 2} RETURNING *`,
    [...values, req.params.auditId, req.user.organizationId],
  );

  if (!result.rows.length) throw new ApiError(404, 'Audit not found.');
  res.json({ audit: result.rows[0] });
});

export const deleteAudit = asyncHandler(async (req, res) => {
  const audit = await pool.query('SELECT image_path FROM audits WHERE id = $1 AND organization_id = $2', [req.params.auditId, req.user.organizationId]);
  if (!audit.rows.length) throw new ApiError(404, 'Audit not found.');

  const filePath = audit.rows[0].image_path;
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await pool.query('DELETE FROM audits WHERE id = $1 AND organization_id = $2', [req.params.auditId, req.user.organizationId]);
  res.json({ message: 'Audit deleted successfully.' });
});

function toSnakeCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function getAnalysisFailureMessage(error) {
  if (error.status === 401 || error.status === 403) {
    return 'Gemini rejected the configured API key. Check GEMINI_API_KEY in backend/.env.';
  }
  if (error.status === 429) {
    return 'Gemini rate limit reached. Wait briefly, then retry this audit.';
  }
  if (error.status >= 500) {
    return 'Gemini is temporarily unavailable. Retry this audit in a moment.';
  }
  if (error.message === 'AI output failed validation.' || error.message === 'AI returned invalid JSON.') {
    return 'Gemini returned an unreadable analysis. Retry this audit.';
  }
  return 'Gemini analysis failed. Check the backend log for details, then retry this audit.';
}
