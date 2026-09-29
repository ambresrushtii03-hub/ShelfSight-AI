import { Router } from 'express';
import { getAuditTrend, getDashboardSummary, getIssueDistribution, getStorePerformance, getTaskSummary } from '../controllers/analyticsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(requireAuth);

router.get('/dashboard/summary', getDashboardSummary);
router.get('/analytics/audit-trends', getAuditTrend);
router.get('/analytics/issue-distribution', getIssueDistribution);
router.get('/analytics/store-performance', getStorePerformance);
router.get('/analytics/task-summary', getTaskSummary);

export default router;
