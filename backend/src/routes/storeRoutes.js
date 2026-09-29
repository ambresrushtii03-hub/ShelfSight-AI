import { Router } from 'express';
import { createStore, deleteStore, getStoreById, getStores, updateStore } from '../controllers/storeController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createStoreSchema } from '../schemas/storeSchemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', getStores);
router.post('/', validateRequest(createStoreSchema), createStore);
router.get('/:storeId', getStoreById);
router.patch('/:storeId', updateStore);
router.delete('/:storeId', deleteStore);

export default router;
