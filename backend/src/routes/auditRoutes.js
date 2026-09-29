import { Router } from 'express';
import { createAudit, analyzeAudit, getAudits, getAuditById, updateAudit, deleteAudit } from '../controllers/auditController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createAuditMetadataSchema } from '../schemas/auditSchemas.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = Router();
router.use(requireAuth);

router.post('/', upload.single('image'), createAudit);
router.get('/', getAudits);
router.get('/:auditId', getAuditById);
router.post('/:auditId/analyze', analyzeAudit);
router.patch('/:auditId', updateAudit);
router.delete('/:auditId', deleteAudit);

export default router;
