import { Router } from 'express';
import { getFindingById, getFindings, reviewFinding } from '../controllers/findingController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { reviewFindingSchema } from '../schemas/findingSchemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', getFindings);
router.get('/:findingId', getFindingById);
router.patch('/:findingId/review', validateRequest(reviewFindingSchema), reviewFinding);

export default router;
