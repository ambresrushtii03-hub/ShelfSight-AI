import { Router } from 'express';
import { createTask, deleteTask, getTaskById, getTasks, updateTask } from '../controllers/taskController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createTaskSchema } from '../schemas/taskSchemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', getTasks);
router.post('/', validateRequest(createTaskSchema), createTask);
router.get('/:taskId', getTaskById);
router.patch('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

export default router;
