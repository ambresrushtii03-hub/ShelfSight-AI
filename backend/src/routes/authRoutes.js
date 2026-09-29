import { Router } from 'express';
import { login, logout, register, getMe } from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { loginSchema, registerSchema } from '../schemas/authSchemas.js';
import { authRateLimiter } from '../middlewares/rateLimitMiddleware.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

export default router;
