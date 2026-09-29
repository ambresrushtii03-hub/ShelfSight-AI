import { Router } from 'express';
import { createShelf, deleteShelf, getShelfById, listShelves, updateShelf } from '../controllers/shelfController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createShelfSchema } from '../schemas/shelfSchemas.js';

const router = Router();
router.use(requireAuth);

router.get('/stores/:storeId/shelves', listShelves);
router.post('/stores/:storeId/shelves', validateRequest(createShelfSchema), createShelf);
router.get('/shelves/:shelfId', getShelfById);
router.patch('/shelves/:shelfId', updateShelf);
router.delete('/shelves/:shelfId', deleteShelf);

export default router;
